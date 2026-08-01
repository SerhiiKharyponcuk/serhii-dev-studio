import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { Router } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { loginSchema, registerSchema } from "@serhii-dev/contracts";
import { env, isProduction } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { AppError, success } from "../../utils/http.js";
import { sendAccountEmail } from "../../services/mail/mailer.js";

const router = Router();
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false
});
const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false
});
const dummyPasswordHash = bcrypt.hashSync("timing-defense-only", 12);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const cookieBase = {
  httpOnly: true,
  secure: isProduction,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  ...(isProduction && env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};
const accessTtlMinutes = { "5m": 5, "10m": 10, "15m": 15, "30m": 30 } as const;
const refreshCookie = (req: Request) => (req.cookies as Record<string, unknown>).refresh_token;
type SessionUser = { id: string; role: "CLIENT" | "ADMIN" | "SUPPORT" };

async function issueOneTimeToken(
  userId: string,
  type: "PASSWORD_RESET" | "EMAIL_VERIFICATION" | "ADMIN_LOGIN",
  ttlMs: number
) {
  const raw = randomBytes(32).toString("base64url");
  await prisma.authToken.create({
    data: { tokenHash: hash(raw), type, userId, expiresAt: new Date(Date.now() + ttlMs) }
  });
  return raw;
}

function prepareSession(user: SessionUser) {
  const access = jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL
  });
  const raw = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  return { access, raw, expiresAt };
}

function setSessionCookies(res: Response, session: ReturnType<typeof prepareSession>) {
  res.cookie("access_token", session.access, {
    ...cookieBase,
    maxAge: accessTtlMinutes[env.ACCESS_TOKEN_TTL] * 60 * 1000
  });
  res.cookie("refresh_token", session.raw, {
    ...cookieBase,
    path: "/api/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000
  });
}

async function createSession(user: SessionUser, req: Request, res: Response) {
  const session = prepareSession(user);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hash(session.raw),
      userId: user.id,
      expiresAt: session.expiresAt,
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent")?.slice(0, 500) ?? null
    }
  });
  setSessionCookies(res, session);
}

router.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (exists) throw new AppError(409, "Account already exists", "EMAIL_IN_USE");
    const user = await prisma.user.create({
      data: {
        name: `${input.firstName} ${input.lastName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, 12),
        status: "PENDING"
      }
    });
    const token = await issueOneTimeToken(user.id, "EMAIL_VERIFICATION", 24 * 60 * 60 * 1000);
    await sendAccountEmail(
      user.email,
      "Verify your Serhii Dev Studio account",
      `${env.WEB_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`
    ).catch(() => false);
    return success(
      res,
      "Account created. Check your email to verify it before signing in.",
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      201
    );
  } catch (e) {
    next(e);
  }
});
router.post("/login", credentialLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    const passwordMatches = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? dummyPasswordHash
    );
    if (!user || user.status !== "ACTIVE" || user.deletedAt || !passwordMatches)
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    if (user.role === "ADMIN" && env.ADMIN_EMAIL_2FA) {
      await prisma.authToken.updateMany({
        where: { userId: user.id, type: "ADMIN_LOGIN", usedAt: null },
        data: { usedAt: new Date() }
      });
      const token = await issueOneTimeToken(user.id, "ADMIN_LOGIN", 10 * 60 * 1000);
      const sent = await sendAccountEmail(
        user.email,
        "Confirm your Serhii Dev Studio admin sign-in",
        `A sign-in to the Serhii Dev Studio admin panel was requested. Complete it within 10 minutes: ${env.WEB_ORIGIN}/admin/verify?token=${encodeURIComponent(token)}\n\nIf this was not you, do not open the link and change your password.`
      ).catch(() => false);
      if (!sent) {
        await prisma.authToken.deleteMany({ where: { tokenHash: hash(token) } });
        throw new AppError(
          503,
          "Admin verification email is temporarily unavailable",
          "ADMIN_VERIFICATION_UNAVAILABLE"
        );
      }
      return success(
        res,
        "Check your email to confirm this admin sign-in.",
        { requiresAdminVerification: true },
        202
      );
    }
    await createSession(user, req, res);
    return success(res, "Signed in", {
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    next(e);
  }
});
router.post("/admin-verify", credentialLimiter, async (req, res, next) => {
  try {
    const input = z
      .object({ token: z.string().min(32).max(200) })
      .strict()
      .parse(req.body);
    const tokenHash = hash(input.token);
    const record = await prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
    if (
      !record ||
      record.type !== "ADMIN_LOGIN" ||
      record.usedAt ||
      record.expiresAt.getTime() <= Date.now() ||
      record.user.role !== "ADMIN" ||
      record.user.status !== "ACTIVE" ||
      record.user.deletedAt
    )
      throw new AppError(401, "Admin verification link is invalid or expired", "INVALID_TOKEN");
    const claimed = await prisma.authToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() }
    });
    if (claimed.count !== 1)
      throw new AppError(401, "Admin verification link is invalid or expired", "INVALID_TOKEN");
    await createSession(record.user, req, res);
    return success(res, "Admin sign-in confirmed", {
      user: {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        role: record.user.role
      }
    });
  } catch (error) {
    next(error);
  }
});
router.post("/refresh", async (req, res, next) => {
  try {
    const candidate = refreshCookie(req);
    const raw = typeof candidate === "string" ? candidate : undefined;
    if (!raw) throw new AppError(401, "Session expired", "SESSION_EXPIRED");
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash(raw) },
      include: { user: true }
    });
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      throw new AppError(401, "Session expired", "SESSION_REUSE_DETECTED");
    }
    if (!stored || stored.expiresAt.getTime() < Date.now() || stored.user.status !== "ACTIVE")
      throw new AppError(401, "Session expired", "SESSION_EXPIRED");
    const session = prepareSession(stored.user);
    const rotated = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date() }
      });
      if (claimed.count !== 1) return false;
      const replacement = await transaction.refreshToken.create({
        data: {
          tokenHash: hash(session.raw),
          userId: stored.userId,
          expiresAt: session.expiresAt,
          ipAddress: req.ip ?? null,
          userAgent: req.get("user-agent")?.slice(0, 500) ?? null
        }
      });
      await transaction.refreshToken.update({
        where: { id: stored.id },
        data: { replacedById: replacement.id }
      });
      return true;
    });
    if (!rotated) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      throw new AppError(401, "Session expired", "SESSION_REUSE_DETECTED");
    }
    setSessionCookies(res, session);
    return success(res, "Session refreshed", null);
  } catch (e) {
    next(e);
  }
});
router.post("/logout", async (req, res, next) => {
  try {
    const candidate = refreshCookie(req);
    const raw = typeof candidate === "string" ? candidate : undefined;
    if (raw)
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hash(raw), revokedAt: null },
        data: { revokedAt: new Date() }
      });
    res.clearCookie("access_token", cookieBase);
    res.clearCookie("refresh_token", { ...cookieBase, path: "/api/auth" });
    return success(res, "Signed out", null);
  } catch (e) {
    next(e);
  }
});
router.post("/forgot", recoveryLimiter, async (req, res, next) => {
  try {
    const input = z
      .object({ email: z.string().trim().email().max(254) })
      .strict()
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (user && user.status === "ACTIVE") {
      await prisma.authToken.updateMany({
        where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
        data: { usedAt: new Date() }
      });
      const token = await issueOneTimeToken(user.id, "PASSWORD_RESET", 30 * 60 * 1000);
      await sendAccountEmail(
        user.email,
        "Reset your Serhii Dev Studio password",
        `${env.WEB_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`
      ).catch(() => false);
    }
    return success(res, "If the account exists, reset instructions will be sent", null);
  } catch (e) {
    next(e);
  }
});
router.post("/resend", recoveryLimiter, async (req, res, next) => {
  try {
    const input = z
      .object({ email: z.string().trim().email().max(254) })
      .strict()
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (user?.status === "PENDING" && !user.deletedAt) {
      await prisma.authToken.updateMany({
        where: { userId: user.id, type: "EMAIL_VERIFICATION", usedAt: null },
        data: { usedAt: new Date() }
      });
      const token = await issueOneTimeToken(user.id, "EMAIL_VERIFICATION", 24 * 60 * 60 * 1000);
      await sendAccountEmail(
        user.email,
        "Verify your Serhii Dev Studio account",
        `${env.WEB_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`
      ).catch(() => false);
    }
    return success(res, "If the account is awaiting verification, a new link will be sent", null);
  } catch (e) {
    next(e);
  }
});
router.post("/reset", credentialLimiter, async (req, res, next) => {
  try {
    const input = z
      .object({
        token: z.string().min(20).max(200),
        password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)
      })
      .strict()
      .parse(req.body);
    const stored = await prisma.authToken.findUnique({ where: { tokenHash: hash(input.token) } });
    if (
      !stored ||
      stored.type !== "PASSWORD_RESET" ||
      stored.usedAt ||
      stored.expiresAt.getTime() < Date.now()
    )
      throw new AppError(400, "Reset link is invalid or expired", "INVALID_TOKEN");
    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.authToken.updateMany({
        where: {
          id: stored.id,
          type: "PASSWORD_RESET",
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { usedAt: new Date() }
      });
      if (claimed.count !== 1)
        throw new AppError(400, "Reset link is invalid or expired", "INVALID_TOKEN");
      await transaction.user.update({
        where: { id: stored.userId },
        data: { passwordHash }
      });
      await transaction.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    });
    return success(res, "Password reset successfully", null);
  } catch (e) {
    next(e);
  }
});
router.post("/verify-email", async (req, res, next) => {
  try {
    const input = z
      .object({ token: z.string().min(20).max(200) })
      .strict()
      .parse(req.body);
    const stored = await prisma.authToken.findUnique({ where: { tokenHash: hash(input.token) } });
    if (
      !stored ||
      stored.type !== "EMAIL_VERIFICATION" ||
      stored.usedAt ||
      stored.expiresAt.getTime() < Date.now()
    )
      throw new AppError(400, "Verification link is invalid or expired", "INVALID_TOKEN");
    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.authToken.updateMany({
        where: {
          id: stored.id,
          type: "EMAIL_VERIFICATION",
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { usedAt: new Date() }
      });
      if (claimed.count !== 1)
        throw new AppError(400, "Verification link is invalid or expired", "INVALID_TOKEN");
      const activated = await transaction.user.updateMany({
        where: { id: stored.userId, status: "PENDING", deletedAt: null },
        data: { emailVerifiedAt: new Date(), status: "ACTIVE" }
      });
      if (activated.count !== 1)
        throw new AppError(400, "Verification link is invalid or expired", "INVALID_TOKEN");
    });
    return success(res, "Email verified", null);
  } catch (e) {
    next(e);
  }
});
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.auth!.userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        telegram: true,
        discord: true,
        country: true,
        phone: true,
        companyName: true,
        billingAddressLine1: true,
        billingAddressLine2: true,
        billingCity: true,
        billingRegion: true,
        billingPostalCode: true,
        billingCountry: true,
        taxId: true
      }
    });
    if (!user || user.status !== "ACTIVE")
      throw new AppError(401, "Session is no longer active", "SESSION_INACTIVE");
    if (user.role !== req.auth!.role)
      throw new AppError(401, "Session permissions changed", "SESSION_STALE");
    return success(res, "Profile loaded", user);
  } catch (e) {
    next(e);
  }
});
export { router as authRouter };

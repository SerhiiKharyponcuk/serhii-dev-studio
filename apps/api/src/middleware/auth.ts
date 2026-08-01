import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/enums.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/http.js";

type Claims = { sub: string; role: Role };
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies.access_token as string | undefined;
  if (!token) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
  try {
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] }) as Claims;
    if (!claims.sub || !claims.role) throw new Error("Invalid token claims");
    req.auth = { userId: claims.sub, role: claims.role };
    next();
  } catch {
    next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
  }
}
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role))
      return next(new AppError(403, "Access denied", "FORBIDDEN"));
    next();
  };

export const requireCurrentAccount =
  (...roles: Role[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
      if (roles.length && !roles.includes(req.auth.role))
        return next(new AppError(403, "Access denied", "FORBIDDEN"));
      const user = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { role: true, status: true, deletedAt: true }
      });
      if (!user || user.status !== "ACTIVE" || user.deletedAt)
        return next(new AppError(401, "Session is no longer active", "SESSION_INACTIVE"));
      if (user.role !== req.auth.role)
        return next(new AppError(401, "Session permissions changed", "SESSION_STALE"));
      next();
    } catch (error) {
      next(error);
    }
  };

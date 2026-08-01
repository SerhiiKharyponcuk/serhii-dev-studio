import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttpModule from "pino-http";
import type { HttpLogger, Options as PinoHttpOptions } from "pino-http";
import { allowedWebOrigins, env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authenticate, requireCurrentAccount } from "./middleware/auth.js";
import { verifyOrigin } from "./middleware/csrf.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { orderRouter } from "./modules/orders/order.routes.js";
import { adminRouter, clientRouter } from "./modules/resources/resource.routes.js";
import { fileRouter } from "./modules/files/file.routes.js";
import { messageRouter } from "./modules/messages/message.routes.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { reviewRouter } from "./modules/reviews/review.routes.js";
import { portfolioRouter, serviceRouter } from "./modules/catalog/catalog.routes.js";
import { userRouter } from "./modules/users/user.routes.js";
import { AppError, success } from "./utils/http.js";

export const app = express();
const pinoHttp = pinoHttpModule as unknown as (options: PinoHttpOptions) => HttpLogger;
const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (req.originalUrl.length > 2_048)
    return next(new AppError(414, "Request URL is too long", "URL_TOO_LONG"));
  const contentLength = Number(req.get("content-length") ?? 0);
  const contentType = req.get("content-type")?.toLowerCase() ?? "";
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    contentLength > 0 &&
    !contentType.startsWith("application/json") &&
    !contentType.startsWith("multipart/form-data")
  )
    return next(new AppError(415, "Unsupported request content type", "UNSUPPORTED_MEDIA_TYPE"));
  return next();
});
app.use(
  pinoHttp({
    level: env.LOG_LEVEL,
    redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"]
  })
);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedWebOrigins.has(origin)),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Upload-Token"],
    maxAge: 600
  })
);
app.use(express.json({ limit: "200kb", strict: true }));
app.use(cookieParser());
app.use(verifyOrigin);
app.get("/api/health", (_req, res) =>
  success(res, "Service healthy", {
    status: "ok",
    version: env.SERVICE_VERSION
  })
);
app.get("/api/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return success(res, "Service ready", { status: "ready" });
  } catch (error) {
    req.log.error({ err: error }, "Database readiness check failed");
    return res.status(503).json({
      success: false,
      message: "Service is not ready",
      error: { code: "DATABASE_UNAVAILABLE" }
    });
  }
});
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false
  }),
  noStore,
  authRouter
);
app.use(
  "/api/orders",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false
  }),
  orderRouter
);
app.use("/api/reviews", reviewRouter);
app.use("/api/services", serviceRouter);
app.use("/api/portfolio", portfolioRouter);
app.use(
  "/api/contact",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false
  }),
  contactRouter
);
app.use(
  "/api/client",
  noStore,
  authenticate,
  requireCurrentAccount("CLIENT", "ADMIN"),
  clientRouter
);
app.use("/api/files", noStore, authenticate, fileRouter);
app.use("/api/messages", noStore, authenticate, messageRouter);
app.use("/api/users", noStore, authenticate, userRouter);
app.use("/api/admin", noStore, authenticate, requireCurrentAccount("ADMIN"), adminRouter);
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found", error: { code: "NOT_FOUND" } })
);
app.use(errorHandler);

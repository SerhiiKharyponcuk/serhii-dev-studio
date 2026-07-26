import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authenticate } from "./middleware/auth.js";
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
import { success } from "./utils/http.js";

export const app = express();
const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  })
);
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());
app.use(verifyOrigin);
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
app.use("/api/client", noStore, authenticate, clientRouter);
app.use("/api/files", noStore, authenticate, fileRouter);
app.use("/api/messages", noStore, authenticate, messageRouter);
app.use("/api/users", noStore, authenticate, userRouter);
app.use("/api/admin", noStore, authenticate, adminRouter);
app.get("/api/health", (_req, res) => success(res, "Service healthy", { status: "ok" }));
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found", error: { code: "NOT_FOUND" } })
);
app.use(errorHandler);

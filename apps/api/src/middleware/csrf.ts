import type { NextFunction, Request, Response } from "express";
import { allowedWebOrigins } from "../config/env.js";
import { AppError } from "../utils/http.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
export function verifyOrigin(req: Request, _res: Response, next: NextFunction) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin && allowedWebOrigins.has(origin)) return next();
  return next(new AppError(403, "Request origin is not allowed", "CSRF_CHECK_FAILED"));
}

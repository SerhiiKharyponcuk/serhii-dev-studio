import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/enums.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/http.js";

type Claims = { sub: string; role: Role };
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies.access_token as string | undefined;
  if (!token) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
  try {
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as Claims;
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

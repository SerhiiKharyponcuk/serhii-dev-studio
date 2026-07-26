import type { Response } from "express";

export function success<T>(res: Response, message: string, data: T, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED"
  ) {
    super(message);
  }
}

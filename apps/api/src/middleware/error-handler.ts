import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/http.js";
import multer from "multer";

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  void next;
  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      error: { code: "VALIDATION_ERROR", fields: error.flatten().fieldErrors }
    });
    return;
  }
  if (error instanceof AppError) {
    res
      .status(error.status)
      .json({ success: false, message: error.message, error: { code: error.code } });
    return;
  }
  if (error instanceof multer.MulterError) {
    res
      .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 422)
      .json({ success: false, message: "File upload was rejected", error: { code: error.code } });
    return;
  }
  req.log.error({ err: error }, "Unhandled request error");
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    error: { code: "INTERNAL_ERROR" }
  });
};

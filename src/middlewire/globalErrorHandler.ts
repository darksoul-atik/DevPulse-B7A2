import type { NextFunction, Request, Response } from "express";

export interface ICustomError extends Error {
  statusCode?: number;
  errors?: string;
}

export const globalErrorHandler = (
  error: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
    errors:
      error.errors ||
      error.message ||
      "Internal server error",
  });
};
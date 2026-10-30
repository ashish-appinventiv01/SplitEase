
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../common/errors";

export class ErrorMiddleware {
    
  public handle(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const statusCode =
      error instanceof ApiError ? error.statusCode : 500;

    const message =
      error instanceof ApiError
        ? error.message
        : "Internal server error";

    if (statusCode === 500) {
      console.error(error);
    }

    res.status(statusCode).json({
      success: false,
      message
    });
  }
}

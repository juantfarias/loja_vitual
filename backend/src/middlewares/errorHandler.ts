import { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/AppError";

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: error.type,
      message: error.message,
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: "InternalServerError",
    message: "Erro interno inesperado no servidor.",
  });
}

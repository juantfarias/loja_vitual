import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/AppError";

const PRISMA_NOT_FOUND_CODES = new Set(["P2023", "P2025"]);

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

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    PRISMA_NOT_FOUND_CODES.has(error.code)
  ) {
    response.status(404).json({
      error: "NotFound",
      message: "Recurso não encontrado.",
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: "InternalServerError",
    message: "Erro interno inesperado no servidor.",
  });
}

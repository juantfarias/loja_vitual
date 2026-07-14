import { AppError } from "./AppError";

export function assertProdutoIdOuFalhar(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) {
    throw new AppError("produtoId inválido.", 404, "NotFound");
  }
  return valor;
}

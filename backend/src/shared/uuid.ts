import { AppError } from "./AppError";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(valor: string): boolean {
  return UUID_REGEX.test(valor);
}

export function assertUuidOrNotFound(valor: string, campo: string): void {
  if (!isUuid(valor)) {
    throw new AppError(`${campo} inválido.`, 404, "NotFound");
  }
}

export class AppError extends Error {
  public readonly type: string;
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400, type = "BadRequest") {
    super(message);
    this.type = type;
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

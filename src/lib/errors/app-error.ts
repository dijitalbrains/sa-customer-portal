export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  CONFLICT = "CONFLICT",
  INTERNAL = "INTERNAL",
}

const USER_MESSAGE_BY_CODE: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: "You need to sign in to continue.",
  [ErrorCode.FORBIDDEN]: "You do not have permission to do that.",
  [ErrorCode.NOT_FOUND]: "We couldn't find what you were looking for.",
  [ErrorCode.VALIDATION_FAILED]: "Some of the information provided is invalid.",
  [ErrorCode.CONFLICT]:
    "This action conflicts with the current state. Please refresh and try again.",
  [ErrorCode.INTERNAL]: "Something went wrong on our end. Please try again.",
};

const HTTP_STATUS_BY_CODE: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL]: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? USER_MESSAGE_BY_CODE[code]);
    this.name = "AppError";
    this.code = code;
    this.statusCode = HTTP_STATUS_BY_CODE[code];
  }

  get userMessage(): string {
    return USER_MESSAGE_BY_CODE[this.code];
  }
}

export function getUserMessage(code: ErrorCode): string {
  return USER_MESSAGE_BY_CODE[code];
}

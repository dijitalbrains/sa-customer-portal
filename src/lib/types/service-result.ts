import type { AppError } from "@/lib/errors/app-error";

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

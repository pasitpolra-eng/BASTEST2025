import { AppError } from "@/types";

/**
 * Unified error handling utilities
 */

export class NetworkError extends Error implements AppError {
  code = "NETWORK_ERROR";
  statusCode = 0;
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "NetworkError";
    this.details = details;
  }
}

export class ValidationError extends Error implements AppError {
  code = "VALIDATION_ERROR";
  statusCode = 400;
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class AuthError extends Error implements AppError {
  code = "AUTH_ERROR";
  statusCode = 401;
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AuthError";
    this.details = details;
  }
}

export class ServerError extends Error implements AppError {
  code = "SERVER_ERROR";
  statusCode = 500;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = "ServerError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Handle API errors consistently
 */
type ErrorPayload = { error?: string; message?: string; [key: string]: unknown };

export async function handleApiError(response: Response): Promise<never> {
  const contentType = response.headers.get("content-type");
  let errorData: ErrorPayload = {};

  try {
    if (contentType?.includes("application/json")) {
      errorData = (await response.json()) as ErrorPayload;
    } else {
      errorData = { message: await response.text() };
    }
  } catch {
    errorData = { message: response.statusText };
  }

  const message = (errorData.error as string) || (errorData.message as string) || "Unknown error";

  if (response.status === 401) {
    throw new AuthError(message, errorData);
  }

  if (response.status === 400) {
    throw new ValidationError(message, errorData);
  }

  if (response.status >= 500) {
    throw new ServerError(message, response.status, errorData);
  }

  throw new Error(message);
}

/**
 * Retry logic for failed requests
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;

  if (error instanceof ValidationError) {
    return error.message || "ข้อมูลที่ส่งไม่ถูกต้อง";
  }

  if (error instanceof AuthError) {
    return error.message || "ไม่มีสิทธิ์เข้าถึง";
  }

  if (error instanceof NetworkError) {
    return "ไม่สามารถเชื่อมต่อ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
  }

  if (error instanceof ServerError) {
    return error.message || "เกิดข้อผิดพลาดในเซิร์ฟเวอร์";
  }

  if (error instanceof Error) {
    return error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
  }

  return "เกิดข้อผิดพลาด";
}

/**
 * Log errors consistently
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const message = formatErrorMessage(error);

  console.error(`[${timestamp}] ${context}:`, {
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalData,
  });

  // Could send to error tracking service here
  // e.g., Sentry, LogRocket, etc.
}

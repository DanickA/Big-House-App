import { Result } from './result';

export abstract class AppError extends Error {
  abstract readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
}

export class ConcurrencyError extends AppError {
  readonly code = 'CONCURRENCY_CYCLE_MISMATCH';
}

export class DuplicateError extends AppError {
  readonly code = 'IDEMPOTENCY_DUPLICATE';
}

export class UnexpectedError extends AppError {
  readonly code = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'Ocurrió un error inesperado', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export type ActionResponse<T> =
  | { success: true; data: T; error?: never; code?: never }
  | ({ success: false; error: string; code?: string; data?: never } & Record<string, unknown>);

/**
 * Convierte un Result<T, AppError> en la estructura estándar esperada por los componentes de React:
 * { success: true, data: T } | { success: false, error: string, code?: string, ...details }
 */
export function toActionResponse<T>(result: Result<T, AppError | Error>): ActionResponse<T> {
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const error = result.error;
  if (error instanceof AppError) {
    const safeDetails: Record<string, unknown> = {};
    if (error.details) {
      for (const [k, v] of Object.entries(error.details)) {
        if (k !== 'original' && k !== 'stack' && k !== 'cause') {
          safeDetails[k] = v;
        }
      }
    }
    return {
      success: false,
      error: error.message,
      code: error.code,
      ...safeDetails,
    };
  }

  return {
    success: false,
    error: error.message || 'Error desconocido',
  };
}

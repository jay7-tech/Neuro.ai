/**
 * Typed application errors. Services throw these; the HTTP layer maps them to status
 * codes in exactly one place, so no route handler hand-writes error responses.
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'INTERNAL';

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export const badRequest = (msg: string, details?: unknown) => new AppError('BAD_REQUEST', msg, details);
export const unauthenticated = (msg = 'Authentication required') => new AppError('UNAUTHENTICATED', msg);
export const forbidden = (msg = 'You do not have access to this resource') => new AppError('FORBIDDEN', msg);
export const notFound = (entity: string) => new AppError('NOT_FOUND', `${entity} not found`);
export const conflict = (msg: string) => new AppError('CONFLICT', msg);

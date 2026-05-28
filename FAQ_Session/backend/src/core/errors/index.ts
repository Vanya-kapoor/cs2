import { AppError } from './AppError';
import { HttpStatus } from '../constants/httpStatus';

/**
 * Bad Request (400) — Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, true, details);
  }
}

/**
 * Unauthorized (401) — Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, true, details);
  }
}

/**
 * Forbidden (403) — User authenticated but lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.FORBIDDEN, true, details);
  }
}

/**
 * Not Found (404) — Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.NOT_FOUND, true, details);
  }
}

/**
 * Conflict (409) — Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.CONFLICT, true, details);
  }
}

/**
 * Unprocessable Entity (422) — Validation failed
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, true, details);
  }
}

/**
 * Internal Server Error (500) — Server error (not operational)
 */
export class InternalServerError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, false, details);
  }
}

/**
 * Database Error (500) — Database operation failed
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, false, details);
  }
}

/**
 * Authentication Error (401) — Auth configuration or process failed
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, false, details);
  }
}

/**
 * Authorization Error (403) — Permission/role-based access denied
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.FORBIDDEN, true, details);
  }
}

/**
 * Service Error (503) — External service unavailable
 */
export class ServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, true, details);
  }
}

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (message: string, details?: unknown): HttpError =>
  new HttpError(400, 'BAD_REQUEST', message, details);

export const Unauthorized = (message = 'Authentication required'): HttpError =>
  new HttpError(401, 'UNAUTHORIZED', message);

export const Forbidden = (message = 'You do not have access to this resource'): HttpError =>
  new HttpError(403, 'FORBIDDEN', message);

export const NotFound = (resource = 'Resource'): HttpError =>
  new HttpError(404, 'NOT_FOUND', `${resource} not found`);

export const Conflict = (message: string, details?: unknown): HttpError =>
  new HttpError(409, 'CONFLICT', message, details);

export const UnprocessableEntity = (message: string, details?: unknown): HttpError =>
  new HttpError(422, 'UNPROCESSABLE', message, details);

export const TooManyRequests = (message = 'Too many requests'): HttpError =>
  new HttpError(429, 'TOO_MANY_REQUESTS', message);

export const Internal = (message = 'Internal server error'): HttpError =>
  new HttpError(500, 'INTERNAL', message);

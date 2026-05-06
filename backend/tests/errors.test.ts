import { describe, expect, it } from 'vitest';
import {
  BadRequest,
  Conflict,
  Forbidden,
  HttpError,
  NotFound,
  Unauthorized,
} from '../src/lib/errors.js';

describe('HttpError helpers', () => {
  it('BadRequest is a 400', () => {
    const e = BadRequest('bad input');
    expect(e).toBeInstanceOf(HttpError);
    expect(e.status).toBe(400);
    expect(e.code).toBe('BAD_REQUEST');
  });

  it('Unauthorized is a 401', () => {
    expect(Unauthorized().status).toBe(401);
  });

  it('Forbidden is a 403', () => {
    expect(Forbidden().status).toBe(403);
  });

  it('NotFound formats the message with the resource', () => {
    const e = NotFound('Task');
    expect(e.message).toBe('Task not found');
    expect(e.status).toBe(404);
  });

  it('Conflict carries optional details', () => {
    const e = Conflict('dup', { field: 'email' });
    expect(e.status).toBe(409);
    expect(e.details).toEqual({ field: 'email' });
  });
});

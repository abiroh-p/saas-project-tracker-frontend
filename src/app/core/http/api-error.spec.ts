import { HttpErrorResponse } from '@angular/common/http';
import { normalizeError } from './api-error';

const httpError = (status: number, body: unknown) =>
  new HttpErrorResponse({ status, statusText: 'x', error: body });

describe('normalizeError', () => {
  it('maps status 0 to a network error', () => {
    const result = normalizeError(httpError(0, null));
    expect(result.status).toBe(0);
    expect(result.code).toBe('network_error');
    expect(result.detail).toMatch(/unable to reach the server/i);
  });

  it('keeps detail and code from the backend envelope', () => {
    const result = normalizeError(
      httpError(403, {
        detail: 'Only project managers can add members.',
        code: 'permission_denied',
      }),
    );
    expect(result).toEqual({
      status: 403,
      code: 'permission_denied',
      detail: 'Only project managers can add members.',
    });
  });

  it('keeps field errors from validation responses', () => {
    const result = normalizeError(
      httpError(400, {
        detail: 'Validation failed.',
        code: 'validation_error',
        errors: { username: ['A user with that username already exists.'] },
      }),
    );
    expect(result.code).toBe('validation_error');
    expect(result.errors).toEqual({ username: ['A user with that username already exists.'] });
  });

  it('flattens nested and non-array errors into string arrays', () => {
    const result = normalizeError(
      httpError(400, {
        detail: 'Validation failed.',
        code: 'validation_error',
        errors: { password: 'Too short.', nested: { inner: ['a', 'b'] }, empty: [] },
      }),
    );
    expect(result.errors).toEqual({ password: ['Too short.'], nested: ['a', 'b'] });
  });

  it('uses a friendly message for 5xx responses without a body', () => {
    const result = normalizeError(httpError(500, '<html>boom</html>'));
    expect(result.code).toBe('server_error');
    expect(result.detail).toMatch(/something went wrong/i);
  });

  it('handles non-HTTP errors', () => {
    expect(normalizeError(new Error('x')).code).toBe('unknown_error');
  });
});

import { apiErrorOf } from './resource-error';

const apiError = { status: 404, code: 'not_found', detail: 'Not found.' };

describe('apiErrorOf', () => {
  it('returns null when there is no error', () => {
    expect(apiErrorOf(undefined)).toBeNull();
    expect(apiErrorOf(null)).toBeNull();
  });

  it('passes an ApiError through', () => {
    expect(apiErrorOf(apiError)).toBe(apiError);
  });

  it('unwraps the error Angular puts in .cause', () => {
    const wrapped = new Error('wrapped', { cause: apiError });
    expect(apiErrorOf(wrapped)).toBe(apiError);
  });

  it('falls back to a generic message for unexpected errors', () => {
    expect(apiErrorOf(new Error('boom'))).toMatchObject({
      code: 'unknown_error',
      detail: 'Something went wrong. Please try again.',
    });
  });
});

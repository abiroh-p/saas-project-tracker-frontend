import { isApiError, type ApiError } from '../api/models';

const FALLBACK: ApiError = {
  status: 0,
  code: 'unknown_error',
  detail: 'Something went wrong. Please try again.',
};

/**
 * Returns the `ApiError` behind `resource.error()` / `rxResource(...).error()`.
 *
 * Angular wraps anything that is not an `Error` instance, and our HTTP errors are plain
 * `ApiError` objects, so the original sits in `.cause`. Always read resource errors through this.
 */
export function apiErrorOf(error: unknown): ApiError | null {
  if (error === undefined || error === null) {
    return null;
  }
  if (isApiError(error)) {
    return error;
  }
  const cause = (error as { cause?: unknown }).cause;
  return isApiError(cause) ? cause : FALLBACK;
}

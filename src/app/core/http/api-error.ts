import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '../api/models';

const NETWORK_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const SERVER_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';
const FALLBACK_MESSAGE = 'The request could not be completed. Please try again.';

/** Converts anything thrown by `HttpClient` into the app-wide {@link ApiError} shape. */
export function normalizeError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: 0, code: 'unknown_error', detail: FALLBACK_MESSAGE };
  }

  if (error.status === 0) {
    return { status: 0, code: 'network_error', detail: NETWORK_MESSAGE };
  }

  const body: unknown = error.error;
  const record = isRecord(body) ? body : {};

  const detail =
    typeof record['detail'] === 'string' && record['detail'].length > 0
      ? record['detail']
      : error.status >= 500
        ? SERVER_MESSAGE
        : FALLBACK_MESSAGE;

  const code =
    typeof record['code'] === 'string' && record['code'].length > 0
      ? record['code']
      : error.status >= 500
        ? 'server_error'
        : 'error';

  const errors = isRecord(record['errors']) ? flattenErrors(record['errors']) : undefined;

  return errors && Object.keys(errors).length > 0
    ? { status: error.status, code, detail, errors }
    : { status: error.status, code, detail };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** DRF can nest errors (lists of messages, nested objects); the UI only needs `string[]` per field. */
function flattenErrors(errors: Record<string, unknown>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(errors)) {
    const messages = collectMessages(value);
    if (messages.length > 0) {
      result[field] = messages;
    }
  }
  return result;
}

function collectMessages(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectMessages);
  }
  if (isRecord(value)) {
    return Object.values(value).flatMap(collectMessages);
  }
  return [];
}

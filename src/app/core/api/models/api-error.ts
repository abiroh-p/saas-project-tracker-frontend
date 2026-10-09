/**
 * Normalised error shape used everywhere in the UI.
 *
 * The backend sends `{ detail, code }` for general errors and
 * `{ detail, code: 'validation_error', errors: { field: [messages] } }` for validation errors.
 */
export interface ApiError {
  /** HTTP status, or 0 when the server could not be reached. */
  status: number;
  /** Machine-readable code, e.g. `validation_error`, `permission_denied`, `network_error`. */
  code: string;
  /** Human-readable message that is safe to show to the user. */
  detail: string;
  /** Field-level messages for validation errors (`non_field_errors` for form-level ones). */
  errors?: Record<string, string[]>;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiError).status === 'number' &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).detail === 'string'
  );
}

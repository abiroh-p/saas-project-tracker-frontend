import { AbstractControl, FormGroup } from '@angular/forms';
import type { ApiError } from '../api/models';

/**
 * Maps a backend error onto a reactive form.
 *
 * - Field errors are set on the matching control as `{ server: message }`. They clear
 *   automatically the next time the user edits that control.
 * - Everything that cannot be shown next to a field (non-field errors, unknown fields, general
 *   errors such as network failures) is returned as a single message for an alert.
 *
 * @param fieldMap maps backend field names to form control names when they differ.
 * @returns the message to show in a form-level alert, or `null` if everything was mapped.
 */
export function applyServerErrors(
  form: FormGroup,
  error: ApiError,
  fieldMap: Record<string, string> = {},
): string | null {
  if (!error.errors) {
    return error.detail;
  }

  const unmapped: string[] = [];

  for (const [field, messages] of Object.entries(error.errors)) {
    const control: AbstractControl | null =
      field === 'non_field_errors' ? null : form.get(fieldMap[field] ?? field);

    if (control) {
      control.setErrors({ server: messages[0] });
      control.markAsTouched();
    } else {
      unmapped.push(
        ...messages.map((message) =>
          field === 'non_field_errors' ? message : `${humanize(field)}: ${message}`,
        ),
      );
    }
  }

  return unmapped.length > 0 ? unmapped.join(' ') : null;
}

function humanize(field: string): string {
  const spaced = field.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

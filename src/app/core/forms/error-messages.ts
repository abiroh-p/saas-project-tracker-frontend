import type { ValidationErrors } from '@angular/forms';

/** Returns the first user-facing message for a control's validation errors, or `null`. */
export function firstErrorMessage(errors: ValidationErrors | null, label: string): string | null {
  if (!errors) {
    return null;
  }

  if (typeof errors['server'] === 'string') {
    return errors['server'];
  }
  if (typeof errors['message'] === 'string') {
    return errors['message'];
  }
  if (errors['required']) {
    return `${label} is required.`;
  }
  if (errors['email']) {
    return 'Enter a valid email address.';
  }
  if (errors['minlength']) {
    return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
  }
  if (errors['maxlength']) {
    return `${label} must be at most ${errors['maxlength'].requiredLength} characters.`;
  }
  if (errors['mismatch']) {
    return 'Passwords do not match.';
  }
  if (errors['range']) {
    return 'End date must be on or after the start date.';
  }
  if (errors['pattern']) {
    return `${label} has an invalid format.`;
  }
  return `${label} is invalid.`;
}

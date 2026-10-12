import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Allowed project keys: 2-10 letters or digits, starting with a letter (matches the backend). */
export const PROJECT_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]{1,9}$/;

/**
 * Suggests a key from a project name: initials of up to 5 words ("Website Redesign" → "WR"), or the
 * first 4 letters of a single word ("Mobile" → "MOBI"). Returns '' when nothing sensible exists.
 */
export function suggestProjectKey(name: string): string {
  const words = name.split(/[^A-Za-z0-9]+/).filter((word) => /^[A-Za-z]/.test(word));

  if (words.length === 0) {
    return '';
  }

  const key =
    words.length === 1
      ? words[0].slice(0, 4)
      : words
          .slice(0, 5)
          .map((word) => word.charAt(0))
          .join('');

  return key.length >= 2 ? key.toUpperCase() : '';
}

/** Form validator: shows a helpful message instead of a generic pattern error. */
export function projectKeyValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || PROJECT_KEY_PATTERN.test(value)
    ? null
    : { message: 'Use 2 to 10 letters or digits, starting with a letter.' };
}

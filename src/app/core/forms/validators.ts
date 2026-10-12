import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Like `Validators.required`, but whitespace-only input counts as empty. */
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/** Group validator: marks `confirmKey` with `{ mismatch: true }` when it differs from `key`. */
export function matchValues(key: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirmControl = group.get(confirmKey);
    if (!confirmControl) {
      return null;
    }

    const mismatch = group.get(key)?.value !== confirmControl.value && confirmControl.value !== '';
    const { mismatch: _removed, ...rest } = confirmControl.errors ?? {};
    const next = mismatch ? { ...rest, mismatch: true } : rest;
    confirmControl.setErrors(Object.keys(next).length > 0 ? next : null);
    return null;
  };
}

/**
 * Group validator for date pairs (`YYYY-MM-DD` strings): marks `endKey` with `{ range: true }` when
 * it is earlier than `startKey`. Empty values are ignored.
 */
export function dateRange(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const endControl = group.get(endKey);
    if (!endControl) {
      return null;
    }

    const start = group.get(startKey)?.value as string | null;
    const end = endControl.value as string | null;
    const invalid = !!start && !!end && end < start;

    const { range: _removed, ...rest } = endControl.errors ?? {};
    const next = invalid ? { ...rest, range: true } : rest;
    endControl.setErrors(Object.keys(next).length > 0 ? next : null);
    return null;
  };
}

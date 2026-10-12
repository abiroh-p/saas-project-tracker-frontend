import { FormControl, FormGroup } from '@angular/forms';
import { applyServerErrors } from './server-errors';
import { firstErrorMessage } from './error-messages';
import { dateRange, matchValues } from './validators';

const makeForm = () =>
  new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

describe('applyServerErrors', () => {
  it('sets field errors on matching controls and returns null when all are mapped', () => {
    const form = makeForm();
    const message = applyServerErrors(form, {
      status: 400,
      code: 'validation_error',
      detail: 'Validation failed.',
      errors: { email: ['Enter a valid email address.'] },
    });

    expect(message).toBeNull();
    expect(form.controls.email.errors).toEqual({ server: 'Enter a valid email address.' });
    expect(form.controls.email.touched).toBe(true);
  });

  it('clears the server error when the user edits the field', () => {
    const form = makeForm();
    applyServerErrors(form, {
      status: 400,
      code: 'validation_error',
      detail: 'x',
      errors: { email: ['Taken.'] },
    });

    form.controls.email.setValue('new@example.com');
    expect(form.controls.email.errors).toBeNull();
  });

  it('returns unmapped and non-field errors for an alert', () => {
    const form = makeForm();
    const message = applyServerErrors(form, {
      status: 400,
      code: 'validation_error',
      detail: 'x',
      errors: { non_field_errors: ['Invalid username or password.'], username: ['Taken.'] },
    });

    expect(message).toBe('Invalid username or password. Username: Taken.');
  });

  it('supports a field name map', () => {
    const form = makeForm();
    applyServerErrors(
      form,
      { status: 400, code: 'validation_error', detail: 'x', errors: { username: ['Taken.'] } },
      { username: 'email' },
    );
    expect(form.controls.email.errors).toEqual({ server: 'Taken.' });
  });

  it('returns the detail for errors without field data', () => {
    expect(
      applyServerErrors(makeForm(), { status: 0, code: 'network_error', detail: 'Offline.' }),
    ).toBe('Offline.');
  });
});

describe('matchValues', () => {
  it('flags the confirm control when values differ and clears it when they match', () => {
    const form = new FormGroup(
      { password: new FormControl('abc12345'), confirm: new FormControl('') },
      { validators: matchValues('password', 'confirm') },
    );

    form.controls.confirm.setValue('different');
    expect(form.controls.confirm.errors).toEqual({ mismatch: true });

    form.controls.confirm.setValue('abc12345');
    expect(form.controls.confirm.errors).toBeNull();
  });
});

describe('dateRange', () => {
  const make = (start: string, end: string) =>
    new FormGroup(
      { start: new FormControl(start), end: new FormControl(end) },
      { validators: dateRange('start', 'end') },
    );

  it('flags an end date before the start date', () => {
    expect(make('2026-12-01', '2026-11-01').controls.end.errors).toEqual({ range: true });
  });

  it('accepts equal dates and ignores empty values', () => {
    expect(make('2026-12-01', '2026-12-01').controls.end.errors).toBeNull();
    expect(make('', '2026-12-01').controls.end.errors).toBeNull();
    expect(make('2026-12-01', '').controls.end.errors).toBeNull();
  });

  it('clears the error once the dates are fixed and keeps other errors', () => {
    const form = make('2026-12-01', '2026-11-01');
    form.controls.end.setValue('2027-01-01');
    expect(form.controls.end.errors).toBeNull();
  });
});

describe('firstErrorMessage', () => {
  it('prefers a custom message, then server errors', () => {
    expect(firstErrorMessage({ message: 'Custom.' }, 'Field')).toBe('Custom.');
    expect(firstErrorMessage({ server: 'Taken.' }, 'Field')).toBe('Taken.');
    expect(firstErrorMessage({ range: true }, 'End date')).toBe(
      'End date must be on or after the start date.',
    );
  });
});

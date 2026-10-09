import { FormControl, FormGroup } from '@angular/forms';
import { applyServerErrors } from './server-errors';
import { matchValues } from './validators';

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

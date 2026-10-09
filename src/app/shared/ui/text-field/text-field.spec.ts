import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextField } from './text-field';

@Component({
  imports: [ReactiveFormsModule, TextField],
  template: `<app-text-field
    label="Email"
    type="email"
    hint="We never share it."
    [formControl]="control"
  />`,
})
class EmailHost {
  control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
}

@Component({
  imports: [ReactiveFormsModule, TextField],
  template: `<app-text-field label="Password" type="password" [formControl]="control" />`,
})
class PasswordHost {
  control = new FormControl('secret', { nonNullable: true });
}

describe('TextField', () => {
  it('renders the label bound to the input', async () => {
    const fixture = TestBed.createComponent(EmailHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    const input = el.querySelector('input')!;
    const label = el.querySelector('label')!;
    expect(label.textContent).toContain('Email');
    expect(label.getAttribute('for')).toBe(input.id);
    expect(el.textContent).toContain('We never share it.');
  });

  it('writes typed values to the form control', async () => {
    const fixture = TestBed.createComponent(EmailHost);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    input.value = 'sam@example.com';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe('sam@example.com');
  });

  it('shows no error until the control is touched, then an accessible message', async () => {
    const fixture = TestBed.createComponent(EmailHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('[role="alert"]')).toBeNull();

    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();

    const alert = el.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('Email is required.');
    const input = el.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('shows server errors set on the control', async () => {
    const fixture = TestBed.createComponent(EmailHost);
    fixture.componentInstance.control.setValue('taken@example.com');
    await fixture.whenStable();

    fixture.componentInstance.control.setErrors({ server: 'That email is already registered.' });
    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'That email is already registered.',
    );
  });

  it('toggles password visibility', async () => {
    const fixture = TestBed.createComponent(PasswordHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector('input')!;
    const toggle = el.querySelector<HTMLButtonElement>('.field__toggle')!;

    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');

    toggle.click();
    await fixture.whenStable();

    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { ApiError } from '../../../core/api/models';
import { AuthService, safeReturnUrl } from '../../../core/auth';
import { applyServerErrors, notBlank } from '../../../core/forms';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Checkbox } from '../../../shared/ui/checkbox/checkbox';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, Alert, AuthShell, Button, Checkbox, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Bound from the query string (`withComponentInputBinding`).
  readonly returnUrl = input<string>();
  readonly registered = input<string>();
  readonly reason = input<string>();

  protected readonly form = new FormGroup({
    identifier: new FormControl('', { nonNullable: true, validators: [notBlank] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl(true, { nonNullable: true }),
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly notice = computed(() => {
    if (this.registered()) {
      return {
        variant: 'success' as const,
        text: 'Your account has been created. Please sign in.',
      };
    }
    if (this.reason() === 'expired') {
      return { variant: 'info' as const, text: 'Your session expired. Please sign in again.' };
    }
    return null;
  });

  protected submit(): void {
    // Pressing Enter can submit while a request is in flight.
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password, remember } = this.form.getRawValue();
    this.submitting.set(true);

    this.auth
      .login({ identifier: identifier.trim(), password }, remember)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
        error: (error: ApiError) => this.errorMessage.set(applyServerErrors(this.form, error)),
      });
  }
}

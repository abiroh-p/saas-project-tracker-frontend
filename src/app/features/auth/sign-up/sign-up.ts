import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { ApiError } from '../../../core/api/models';
import { AuthService } from '../../../core/auth';
import { applyServerErrors, matchValues, notBlank } from '../../../core/forms';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { AuthShell } from '../auth-shell/auth-shell';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, Alert, AuthShell, Button, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup(
    {
      full_name: new FormControl('', {
        nonNullable: true,
        validators: [notBlank, Validators.maxLength(150)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(254)],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      password_confirm: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchValues('password', 'password_confirm') },
  );

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { full_name, email, password, password_confirm } = this.form.getRawValue();
    this.submitting.set(true);

    this.auth
      .register({ full_name: full_name.trim(), email: email.trim(), password, password_confirm })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        // The API does not sign the user in, so hand over to the sign-in page with a notice.
        next: () => void this.router.navigate(['/sign-in'], { queryParams: { registered: '1' } }),
        // Field names in the API response match the control names.
        error: (error: ApiError) => this.errorMessage.set(applyServerErrors(this.form, error)),
      });
  }
}

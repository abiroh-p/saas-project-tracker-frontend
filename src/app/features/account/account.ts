import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import type { ApiError } from '../../core/api/models';
import { AuthService } from '../../core/auth';
import { applyServerErrors, matchValues } from '../../core/forms';
import { Alert } from '../../shared/ui/alert/alert';
import { Button } from '../../shared/ui/button/button';
import { Card } from '../../shared/ui/card/card';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TextField } from '../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, Alert, Button, Card, PageHeader, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // Control names match the API field names so server errors land on the right input.
  protected readonly form = new FormGroup(
    {
      current_password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      new_password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      new_password_confirm: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchValues('new_password', 'new_password_confirm') },
  );

  protected readonly submitting = signal(false);
  protected readonly saved = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.saved.set(false);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.auth
      .changePassword(this.form.getRawValue())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          this.saved.set(true);
        },
        error: (error: ApiError) => this.errorMessage.set(applyServerErrors(this.form, error)),
      });
  }
}

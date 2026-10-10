import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { USER_ROLE_LABELS, type ApiError } from '../../core/api/models';
import { ProfileService, SessionStore } from '../../core/auth';
import { applyServerErrors, notBlank } from '../../core/forms';
import { Alert } from '../../shared/ui/alert/alert';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Button } from '../../shared/ui/button/button';
import { Card } from '../../shared/ui/card/card';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TextField } from '../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, Alert, Avatar, Button, Card, PageHeader, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly session = inject(SessionStore);
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  // Control names match the API field names so server errors land on the right input.
  protected readonly form = new FormGroup({
    full_name: new FormControl(this.session.user()?.full_name ?? '', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(150)],
    }),
    email: new FormControl(this.session.user()?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    // Read-only: the backend generates it and it cannot be edited.
    username: new FormControl({ value: this.session.user()?.username ?? '', disabled: true }),
  });
  protected readonly roleLabel = () => {
    const role = this.session.user()?.role;
    return role ? USER_ROLE_LABELS[role] : '';
  };

  protected readonly submitting = signal(false);
  protected readonly saved = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // The success message belongs to the values that were just saved; hide it once they change.
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saved.set(false));
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { full_name, email } = this.form.getRawValue();
    this.submitting.set(true);

    this.profileService
      .update({ full_name: full_name.trim(), email: email.trim() })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          // Reset to the values the server stored (it normalises the email) and mark as pristine. The
          // read-only username must be included or reset() would blank it.
          this.form.reset({
            full_name: user.full_name,
            email: user.email,
            username: user.username,
          });
          this.saved.set(true);
        },
        error: (error: ApiError) => this.errorMessage.set(applyServerErrors(this.form, error)),
      });
  }
}

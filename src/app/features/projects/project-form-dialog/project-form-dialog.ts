import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import type { ApiError, Project } from '../../../core/api/models';
import { applyServerErrors, dateRange, notBlank } from '../../../core/forms';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Modal } from '../../../shared/ui/dialog/modal';
import { TextArea } from '../../../shared/ui/text-area/text-area';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { projectKeyValidator, suggestProjectKey } from '../project-key';
import { ProjectsService } from '../projects.service';

export interface ProjectFormData {
  /** Present when editing; omitted when creating. */
  project?: Project;
}

/** Create or edit a project. Closes with the saved `Project`, or with nothing when cancelled. */
@Component({
  selector: 'app-project-form-dialog',
  imports: [ReactiveFormsModule, Alert, Button, Modal, TextArea, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-form-dialog.scss',
  templateUrl: './project-form-dialog.html',
})
export class ProjectFormDialog {
  private readonly projects = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ref = inject<DialogRef<Project>>(DialogRef);
  private readonly data = inject<ProjectFormData | null>(DIALOG_DATA, { optional: true });

  protected readonly existing = this.data?.project;
  protected readonly editing = this.existing !== undefined;

  // Control names match the API field names so server errors land on the right input.
  protected readonly form = new FormGroup(
    {
      name: new FormControl(this.existing?.name ?? '', {
        nonNullable: true,
        validators: [notBlank, Validators.maxLength(255)],
      }),
      key: new FormControl(
        { value: this.existing?.key ?? '', disabled: this.editing },
        { nonNullable: true, validators: [Validators.required, projectKeyValidator] },
      ),
      description: new FormControl(this.existing?.description ?? '', { nonNullable: true }),
      start_date: new FormControl(this.existing?.start_date ?? '', { nonNullable: true }),
      end_date: new FormControl(this.existing?.end_date ?? '', { nonNullable: true }),
    },
    { validators: dateRange('start_date', 'end_date') },
  );

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    if (!this.editing) {
      this.suggestKeyFromName();
    }
  }

  /** Fills the key from the name until the user types their own key. */
  private suggestKeyFromName(): void {
    const { name, key } = this.form.controls;
    let keyEditedByUser = false;

    // Programmatic `setValue(..., { emitEvent: false })` below does not emit, so any emission here
    // is the user typing in the key field.
    key.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      keyEditedByUser = true;
    });

    name.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (!keyEditedByUser) {
        key.setValue(suggestProjectKey(value), { emitEvent: false });
      }
    });
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

    const value = this.form.getRawValue();
    const body = {
      name: value.name.trim(),
      description: value.description.trim(),
      start_date: value.start_date || null,
      end_date: value.end_date || null,
    };

    const request = this.existing
      ? this.projects.update(this.existing.id, body)
      : this.projects.create({ ...body, key: value.key.trim().toUpperCase() });

    this.submitting.set(true);

    request
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (project) => this.ref.close(project),
        error: (error: ApiError) => this.errorMessage.set(applyServerErrors(this.form, error)),
      });
  }
}

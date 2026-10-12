import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import {
  PROJECT_ROLES,
  PROJECT_ROLE_LABELS,
  displayNameOf,
  type ApiError,
  type ProjectMember,
  type ProjectRole,
  type UserSummary,
} from '../../../core/api/models';
import { UsersService } from '../../../core/users/users.service';
import { Alert } from '../../../shared/ui/alert/alert';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Button } from '../../../shared/ui/button/button';
import { Modal } from '../../../shared/ui/dialog/modal';
import { Select, type SelectOption } from '../../../shared/ui/select/select';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { ProjectMembersService } from '../project-members.service';
import { apiErrorOf } from '../../../core/http/resource-error';

export const USER_SEARCH_DEBOUNCE_MS = 250;
const MIN_SEARCH_LENGTH = 2;

export interface AddMemberData {
  projectId: number;
  /** Users who are already members; shown as unavailable. */
  existingUserIds: readonly number[];
}

/** Find a person by name or username and add them to the project. Closes with the new member. */
@Component({
  selector: 'app-add-member-dialog',
  imports: [ReactiveFormsModule, Alert, Avatar, Button, Modal, Select, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './add-member-dialog.scss',
  templateUrl: './add-member-dialog.html',
})
export class AddMemberDialog {
  private readonly data = inject<AddMemberData>(DIALOG_DATA);
  private readonly users = inject(UsersService);
  private readonly members = inject(ProjectMembersService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ref = inject<DialogRef<ProjectMember>>(DialogRef);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly role = new FormControl<ProjectRole>('TEAM_MEMBER', { nonNullable: true });
  protected readonly roleOptions: readonly SelectOption[] = PROJECT_ROLES.map((value) => ({
    value,
    label: PROJECT_ROLE_LABELS[value],
  }));

  protected readonly selected = signal<UserSummary | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly term = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(USER_SEARCH_DEBOUNCE_MS),
      map((value) => value.trim()),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly tooShort = computed(() => this.term().length < MIN_SEARCH_LENGTH);

  private readonly searchResource = rxResource<UserSummary[], string | undefined>({
    params: () => (this.term().length >= MIN_SEARCH_LENGTH ? this.term() : undefined),
    stream: ({ params: term }) => this.users.search(term),
  });

  protected readonly searching = this.searchResource.isLoading;
  protected readonly searchError = computed(() => apiErrorOf(this.searchResource.error()));

  protected readonly results = computed(() => {
    if (this.tooShort() || !this.searchResource.hasValue()) {
      return [];
    }
    const existing = new Set(this.data.existingUserIds);
    return this.searchResource.value().map((user) => ({
      user,
      name: displayNameOf(user),
      alreadyMember: existing.has(user.id),
    }));
  });

  protected select(user: UserSummary): void {
    this.selected.set(user);
    this.errorMessage.set(null);
  }

  protected clearSelection(): void {
    this.selected.set(null);
  }

  protected nameOf(user: UserSummary): string {
    return displayNameOf(user);
  }

  protected submit(): void {
    const user = this.selected();
    if (!user || this.submitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.members
      .add(this.data.projectId, { user_id: user.id, role: this.role.value })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (member) => this.ref.close(member),
        // There is no form field to attach server errors to here, so they all go in the alert.
        error: (error: ApiError) =>
          this.errorMessage.set(
            error.errors ? Object.values(error.errors).flat().join(' ') : error.detail,
          ),
      });
  }
}

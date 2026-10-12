import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PROJECT_ROLES,
  PROJECT_ROLE_LABELS,
  displayNameOf,
  type ApiError,
  type ProjectMember,
  type ProjectRole,
} from '../../../core/api/models';
import { SessionStore } from '../../../core/auth';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { Select, type SelectOption } from '../../../shared/ui/select/select';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AddMemberDialog, type AddMemberData } from '../add-member-dialog/add-member-dialog';
import { ProjectContext } from '../project-context';
import { ProjectMembersService } from '../project-members.service';
import { apiErrorOf } from '../../../core/http/resource-error';

interface MemberRow {
  member: ProjectMember;
  name: string;
  isSelf: boolean;
  /** Backs the role select; reset to `member.role` when the server refuses a change. */
  roleControl: FormControl<string>;
}

@Component({
  selector: 'app-project-members',
  imports: [
    Avatar,
    Badge,
    Button,
    Card,
    DatePipe,
    EmptyState,
    Icon,
    ReactiveFormsModule,
    Select,
    Skeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-members.scss',
  templateUrl: './project-members.html',
})
export class ProjectMembers {
  private readonly context = inject(ProjectContext);
  private readonly membersApi = inject(ProjectMembersService);
  private readonly session = inject(SessionStore);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly canManage = this.context.canManage;

  protected readonly roleOptions: readonly SelectOption[] = PROJECT_ROLES.map((value) => ({
    value,
    label: PROJECT_ROLE_LABELS[value],
  }));

  private readonly resource = rxResource<ProjectMember[], number | undefined>({
    params: () => this.context.project()?.id,
    stream: ({ params: projectId }) => this.membersApi.list(projectId),
  });

  protected readonly error = computed(() => apiErrorOf(this.resource.error()));

  protected readonly rows = computed<MemberRow[] | null>(() => {
    if (!this.resource.hasValue()) {
      return null;
    }
    const currentUserId = this.session.user()?.id;
    return this.resource.value().map((member) => ({
      member,
      name: displayNameOf(member),
      isSelf: member.user_id === currentUserId,
      roleControl: new FormControl(member.role, { nonNullable: true }),
    }));
  });

  protected roleLabel(role: ProjectRole): string {
    return PROJECT_ROLE_LABELS[role];
  }

  protected retry(): void {
    this.resource.reload();
  }

  protected addMember(rows: MemberRow[]): void {
    const projectId = this.context.project()?.id;
    if (projectId === undefined) {
      return;
    }

    this.dialogs
      .open<ProjectMember, AddMemberData>(AddMemberDialog, {
        ariaLabel: 'Add member',
        data: { projectId, existingUserIds: rows.map((row) => row.member.user_id) },
      })
      .closed.subscribe((member) => {
        if (member) {
          this.toast.success(`${displayNameOf(member)} was added to the project.`);
          this.resource.reload();
        }
      });
  }

  protected changeRole(row: MemberRow, role: string): void {
    const projectId = this.context.project()?.id;
    if (projectId === undefined || role === row.member.role) {
      return;
    }

    this.membersApi.changeRole(projectId, row.member.id, role as ProjectRole).subscribe({
      next: () => {
        this.toast.success(`${row.name} is now ${PROJECT_ROLE_LABELS[role as ProjectRole]}.`);
        this.resource.reload();
      },
      error: (error: ApiError) => {
        this.toast.error(error.detail);
        // Nothing changed on the server, so show the role the member really has.
        row.roleControl.setValue(row.member.role);
      },
    });
  }

  protected remove(row: MemberRow): void {
    const project = this.context.project();
    if (!project) {
      return;
    }

    this.dialogs
      .confirm(
        row.isSelf
          ? {
              title: 'Leave this project?',
              message: `You will lose access to ${project.key}. A project manager can add you back.`,
              confirmLabel: 'Leave project',
              danger: true,
            }
          : {
              title: 'Remove this member?',
              message: `${row.name} will lose access to ${project.key}, and any issues assigned to them will become unassigned.`,
              confirmLabel: 'Remove member',
              danger: true,
            },
      )
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.membersApi.remove(project.id, row.member.id).subscribe({
          next: () => {
            if (row.isSelf) {
              this.toast.success(`You left ${project.key}.`);
              void this.router.navigateByUrl('/projects');
            } else {
              this.toast.success(`${row.name} was removed from the project.`);
              this.resource.reload();
            }
          },
          error: (error: ApiError) => this.toast.error(error.detail),
        });
      });
  }
}

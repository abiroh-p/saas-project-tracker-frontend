import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PROJECT_ROLE_LABELS, type Project } from '../../../core/api/models';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ProjectContext } from '../project-context';
import {
  ProjectFormDialog,
  type ProjectFormData,
} from '../project-form-dialog/project-form-dialog';
import { ProjectsService } from '../projects.service';

/**
 * Frame for one project: header with key, name and actions, plus tabs. Loads the project once and
 * shares it with the tab pages through `ProjectContext`.
 */
@Component({
  selector: 'app-project-detail',
  imports: [Badge, Button, EmptyState, Icon, RouterLink, RouterLinkActive, RouterOutlet, Skeleton],
  providers: [ProjectContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-detail.scss',
  templateUrl: './project-detail.html',
})
export class ProjectDetail {
  /** Bound from the route (`withComponentInputBinding`). */
  readonly projectId = input.required<string>();

  protected readonly context = inject(ProjectContext);
  private readonly projects = inject(ProjectsService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  private readonly validId = computed(() => {
    const id = Number(this.projectId());
    return Number.isInteger(id) && id > 0 ? id : null;
  });

  protected readonly notFound = computed(
    () => this.validId() === null || this.context.error()?.status === 404,
  );

  protected readonly roleLabel = computed(() => {
    const role = this.context.project()?.my_role;
    return role ? PROJECT_ROLE_LABELS[role] : null;
  });

  constructor() {
    effect(() => this.context.projectId.set(this.validId()));

    effect(() => {
      const project = this.context.project();
      if (project) {
        this.title.setTitle(`${project.key} · ${project.name} · ProjectTracker`);
      }
    });
  }

  protected edit(project: Project): void {
    this.dialogs
      .open<Project, ProjectFormData>(ProjectFormDialog, {
        ariaLabel: 'Edit project',
        data: { project },
      })
      .closed.subscribe((updated) => {
        if (updated) {
          this.context.update(updated);
          this.toast.success('Project updated.');
        }
      });
  }

  protected archive(project: Project): void {
    this.dialogs
      .confirm({
        title: 'Archive this project?',
        message: `${project.key} will be hidden from everyone on the team and can no longer be opened. This cannot be undone from the app.`,
        confirmLabel: 'Archive project',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.projects.archive(project.id).subscribe({
          next: () => {
            this.toast.success(`Project ${project.key} archived.`);
            void this.router.navigateByUrl('/projects');
          },
          error: (error: { detail?: string }) =>
            this.toast.error(error.detail ?? 'The project could not be archived.'),
        });
      });
  }
}

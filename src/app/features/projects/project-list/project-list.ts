import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { Page, Project } from '../../../core/api/models';
import { Button } from '../../../shared/ui/button/button';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ProjectCard } from '../project-card/project-card';
import { ProjectFormDialog } from '../project-form-dialog/project-form-dialog';
import { ProjectsService } from '../projects.service';
import { apiErrorOf } from '../../../core/http/resource-error';

export const PROJECTS_PAGE_SIZE = 12;

@Component({
  selector: 'app-project-list',
  imports: [Button, EmptyState, Icon, PageHeader, Pagination, ProjectCard, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-list.scss',
  templateUrl: './project-list.html',
})
export class ProjectList {
  private readonly projects = inject(ProjectsService);
  private readonly dialogs = inject(DialogService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly pageSize = PROJECTS_PAGE_SIZE;
  protected readonly page = signal(1);

  private readonly resource = rxResource<Page<Project>, number>({
    params: () => this.page(),
    stream: ({ params: page }) => this.projects.list(page, this.pageSize),
  });

  protected readonly error = computed(() => apiErrorOf(this.resource.error()));
  protected readonly data = computed(() =>
    this.resource.hasValue() ? this.resource.value() : null,
  );
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  constructor() {
    // Archiving the last project on a page leaves that page out of range (404): go back to page 1.
    effect(() => {
      if (this.error()?.status === 404 && this.page() > 1) {
        this.page.set(1);
      }
    });
  }

  protected goToPage(page: number): void {
    this.page.set(page);
  }

  protected retry(): void {
    this.resource.reload();
  }

  protected newProject(): void {
    this.dialogs
      .open<Project>(ProjectFormDialog, { ariaLabel: 'New project' })
      .closed.subscribe((project) => {
        if (project) {
          this.toast.success(`Project ${project.key} created.`);
          void this.router.navigate(['/projects', project.id]);
        }
      });
  }
}

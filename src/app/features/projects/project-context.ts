import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Project } from '../../core/api/models';
import { ProjectsService } from './projects.service';
import { apiErrorOf } from '../../core/http/resource-error';

/**
 * State of the project being viewed. Provided by `ProjectDetail`, so its child pages (overview,
 * members, later issues) all read the same loaded project and permissions.
 */
@Injectable()
export class ProjectContext {
  private readonly projects = inject(ProjectsService);

  readonly projectId = signal<number | null>(null);

  private readonly resource = rxResource<Project, number | undefined>({
    params: () => this.projectId() ?? undefined,
    stream: ({ params: id }) => this.projects.get(id),
  });

  readonly project = computed(() => (this.resource.hasValue() ? this.resource.value() : null));
  readonly loading = this.resource.isLoading;
  readonly error = computed(() => apiErrorOf(this.resource.error()));

  /** Only project managers can edit the project, archive it, or manage members. */
  readonly canManage = computed(() => this.project()?.my_role === 'PROJECT_MANAGER');

  /** Replaces the loaded project, e.g. with the response of an edit. */
  update(project: Project): void {
    this.resource.set(project);
  }
}

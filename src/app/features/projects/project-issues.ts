import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Issue, IssueWrite, Page } from '../../core/api/models';
import { ISSUE_PRIORITIES, ISSUE_TYPES, ISSUE_STATUS_LABELS } from '../../core/api/models';
import { apiErrorOf } from '../../core/http/resource-error';
import { Button } from '../../shared/ui/button/button';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { ProjectContext } from './project-context';
import { IssuesService } from '../issues/issues.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

@Component({ selector: 'app-project-issues', imports: [Button, EmptyState, Pagination, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, styleUrl: './project-issues.scss', templateUrl: './project-issues.html' })
export class ProjectIssues {
  protected readonly context = inject(ProjectContext);
  private readonly service = inject(IssuesService);
  private readonly router = inject(Router);
  protected readonly page = signal(1);
  protected readonly creating = signal(false);
  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly issueType = signal('TASK');
  protected readonly priority = signal('MEDIUM');
  protected readonly dueDate = signal('');
  protected readonly saving = signal(false);
  protected readonly problem = signal('');
  protected readonly types = ISSUE_TYPES;
  protected readonly priorities = ISSUE_PRIORITIES;
  protected readonly labels = ISSUE_STATUS_LABELS;
  protected readonly resource = rxResource<Page<Issue>, { id: number; page: number } | undefined>({ params: () => { const id = this.context.projectId(); return id ? { id, page: this.page() } : undefined; }, stream: ({ params }) => this.service.listForProject(params.id, params.page, 20) });
  protected readonly data = computed(() => this.resource.hasValue() ? this.resource.value() : null);
  protected readonly error = computed(() => apiErrorOf(this.resource.error()));
  protected create(): void {
    const id = this.context.projectId();
    if (!id || !this.title().trim()) { this.problem.set('Enter an issue title.'); return; }
    const body: IssueWrite = { title: this.title().trim(), description: this.description(), issue_type: this.issueType() as IssueWrite['issue_type'], priority: this.priority() as IssueWrite['priority'], due_date: this.dueDate() || null };
    this.saving.set(true); this.problem.set('');
    this.service.create(id, body).subscribe({ next: (issue) => { this.saving.set(false); void this.router.navigate(['/issues', issue.id]); }, error: (err: { detail?: string }) => { this.saving.set(false); this.problem.set(err.detail || 'Issue could not be created.'); } });
  }
}

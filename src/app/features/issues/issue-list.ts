import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import type { Issue, IssueFilters, IssuePriority, IssueStatus, IssueType, Page, Project } from '../../core/api/models';
import { ISSUE_PRIORITIES, ISSUE_PRIORITY_LABELS, ISSUE_STATUSES, ISSUE_STATUS_LABELS, ISSUE_TYPES } from '../../core/api/models';
import { IssuesService } from './issues.service';
import { apiErrorOf } from '../../core/http/resource-error';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Button } from '../../shared/ui/button/button';
import { ProjectsService } from '../projects/projects.service';

const PAGE_SIZE = 20;
@Component({ selector: 'app-issue-list', imports: [Button, EmptyState, PageHeader, Pagination, RouterLink, Skeleton], changeDetection: ChangeDetectionStrategy.OnPush, styleUrl: './issue-list.scss', templateUrl: './issue-list.html' })
export class IssueList {
  private readonly service = inject(IssuesService);
  private readonly projects = inject(ProjectsService);
  private readonly router = inject(Router);
  protected readonly creating = signal(false);
  protected readonly creatingTitle = signal('');
  protected readonly creatingProject = signal('');
  protected readonly createError = signal('');
  protected readonly creatingIssue = signal(false);
  private readonly projectsResource = rxResource<Page<Project>, object>({
    params: () => ({}),
    stream: () => this.projects.list(1, 100),
  });
  protected readonly creatableProjects = computed(() => this.projectsResource.hasValue() ? this.projectsResource.value().results.filter((project) => project.my_role !== 'VIEWER') : []);
  protected readonly page = signal(1);
  protected readonly filters = signal<IssueFilters>({});
  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly priority = signal('');
  protected readonly issueType = signal('');
  protected readonly assignee = signal('');
  protected readonly project = signal('');
  protected readonly dueBefore = signal('');
  protected readonly dueAfter = signal('');
  protected readonly ordering = signal('');
  protected readonly statuses = ISSUE_STATUSES;
  protected readonly priorities = ISSUE_PRIORITIES;
  protected readonly types = ISSUE_TYPES;
  protected readonly statusLabels = ISSUE_STATUS_LABELS;
  protected readonly priorityLabels = ISSUE_PRIORITY_LABELS;
  private readonly resource = rxResource<Page<Issue>, { page: number; filters: IssueFilters }>({ params: () => ({ page: this.page(), filters: this.filters() }), stream: ({ params }) => this.service.list(params.page, PAGE_SIZE, params.filters) });
  protected readonly data = computed(() => this.resource.hasValue() ? this.resource.value() : null);
  protected readonly error = computed(() => apiErrorOf(this.resource.error()));
  protected readonly active = computed(() => Object.values(this.filters()).some(Boolean));
  protected retry(): void { this.resource.reload(); }
  protected createIssue(event: Event): void {
    event.preventDefault();
    const projectId = Number(this.creatingProject());
    const title = this.creatingTitle().trim();
    if (!projectId || !title) { this.createError.set('Choose a project and enter a title.'); return; }
    this.creatingIssue.set(true); this.createError.set('');
    this.service.create(projectId, { title }).subscribe({ next: (issue) => { void this.router.navigate(['/issues', issue.id]); }, error: (error: { detail?: string }) => { this.creatingIssue.set(false); this.createError.set(error.detail || 'Issue could not be created.'); } });
  }
  protected goToPage(page: number): void { this.page.set(page); }
  protected apply(event: Event): void {
    event.preventDefault();
    const filters: IssueFilters = { search: this.search().trim(), assignee: this.assignee().trim() };
    if (this.project().trim()) filters.project = Number(this.project());
    if (this.status()) filters.status = this.status() as IssueStatus;
    if (this.priority()) filters.priority = this.priority() as IssuePriority;
    if (this.issueType()) filters.issue_type = this.issueType() as IssueType;
    if (this.dueBefore()) filters.due_before = this.dueBefore();
    if (this.dueAfter()) filters.due_after = this.dueAfter();
    if (this.ordering()) filters.ordering = this.ordering();
    this.filters.set(filters); this.page.set(1);
  }
  protected clear(): void { this.search.set(''); this.status.set(''); this.priority.set(''); this.issueType.set(''); this.assignee.set(''); this.project.set(''); this.dueBefore.set(''); this.dueAfter.set(''); this.ordering.set(''); this.filters.set({}); this.page.set(1); }
}

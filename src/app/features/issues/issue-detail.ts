import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Activity, Comment, Issue, IssuePriority, IssueStatus, IssueType, Page, Project } from '../../core/api/models';
import { ISSUE_PRIORITIES, ISSUE_PRIORITY_LABELS, ISSUE_STATUSES, ISSUE_STATUS_LABELS, ISSUE_TYPES } from '../../core/api/models';
import { SessionStore } from '../../core/auth/session.store';
import { apiErrorOf } from '../../core/http/resource-error';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { IssuesService } from './issues.service';
import { CommentsService } from './comments.service';
import { ActivityService } from '../activity/activity.service';
import { ProjectsService } from '../projects/projects.service';
import { ProjectMembersService } from '../projects/project-members.service';
import type { ProjectMember } from '../../core/api/models';

@Component({ selector: 'app-issue-detail', imports: [DatePipe, EmptyState, RouterLink], changeDetection: ChangeDetectionStrategy.OnPush, styleUrl: './issue-detail.scss', templateUrl: './issue-detail.html' })
export class IssueDetail {
  readonly issueId = input.required<string>();
  private readonly issues = inject(IssuesService);
  private readonly projects = inject(ProjectsService);
  private readonly membersApi = inject(ProjectMembersService);
  private readonly commentsApi = inject(CommentsService);
  private readonly activityApi = inject(ActivityService);
  protected readonly session = inject(SessionStore);
  protected readonly id = computed(() => { const n = Number(this.issueId()); return Number.isInteger(n) && n > 0 ? n : null; });
  protected readonly issueResource = rxResource<Issue, number | undefined>({ params: () => this.id() ?? undefined, stream: ({ params }) => this.issues.get(params) });
  protected readonly issue = computed(() => this.issueResource.hasValue() ? this.issueResource.value() : null);
  protected readonly projectResource = rxResource<Project, number | undefined>({ params: () => this.issue()?.project, stream: ({ params }) => this.projects.get(params) });
  protected readonly project = computed(() => this.projectResource.hasValue() ? this.projectResource.value() : null);
  protected readonly membersResource = rxResource<ProjectMember[], number | undefined>({ params: () => this.issue()?.project, stream: ({ params }) => this.membersApi.list(params) });
  protected readonly assignableMembers = computed(() => this.membersResource.hasValue() ? this.membersResource.value().filter((member) => member.role !== 'VIEWER') : []);
  protected readonly error = computed(() => apiErrorOf(this.issueResource.error()));
  protected readonly title = signal(''); protected readonly description = signal(''); protected readonly issueType = signal<IssueType>('TASK'); protected readonly priority = signal<IssuePriority>('MEDIUM'); protected readonly dueDate = signal(''); protected readonly assignee = signal('');
  protected readonly saving = signal(false); protected readonly actionError = signal(''); protected readonly comments = signal<Comment[]>([]); protected readonly commentBody = signal(''); protected readonly activity = signal<Activity[]>([]);
  protected readonly statuses = ISSUE_STATUSES; protected readonly types = ISSUE_TYPES; protected readonly priorities = ISSUE_PRIORITIES; protected readonly statusLabels = ISSUE_STATUS_LABELS; protected readonly priorityLabels = ISSUE_PRIORITY_LABELS;
  protected readonly canEdit = computed(() => { const i = this.issue(); const p = this.project(); const u = this.session.user(); if (!i || !p || p.my_role === 'VIEWER' || i.is_archived || !u) return false; return p.my_role === 'PROJECT_MANAGER' || i.reporter === u.username || i.assignee === u.id; });
  protected readonly isManager = computed(() => this.project()?.my_role === 'PROJECT_MANAGER');
  protected readonly canComment = computed(() => !!this.project() && this.project()?.my_role !== 'VIEWER' && !this.issue()?.is_archived);
  protected readonly canTransition = computed(() => { const i = this.issue(); const p = this.project(); const u = this.session.user(); return !!i && !!p && !i.is_archived && p.my_role !== 'VIEWER' && (p.my_role === 'PROJECT_MANAGER' || i.assignee === u?.id); });
  protected readonly nextStatus = computed<IssueStatus | null>(() => { const status = this.issue()?.status; if (status === 'TODO') return 'IN_PROGRESS'; if (status === 'IN_PROGRESS') return 'IN_REVIEW'; if (status === 'IN_REVIEW') return 'DONE'; return null; });
  protected readonly editingCommentId = signal<number | null>(null);
  protected readonly editingCommentBody = signal('');
  constructor() { effect(() => { const i = this.issue(); if (i) { this.title.set(i.title); this.description.set(i.description); this.issueType.set(i.issue_type); this.priority.set(i.priority); this.dueDate.set(i.due_date || ''); this.assignee.set(i.assignee?.toString() || ''); this.loadRelated(i.id); } }); }
  protected save(): void { const i = this.issue(); if (!i) return; const assigneeValue = this.assignee().trim(); this.saving.set(true); this.actionError.set(''); this.issues.update(i.id, { title: this.title().trim(), description: this.description(), issue_type: this.issueType(), priority: this.priority(), due_date: this.dueDate() || null, ...(this.isManager() ? { assignee: assigneeValue ? Number(assigneeValue) : null } : {}) }).subscribe({ next: (updated) => { this.issueResource.set(updated); this.saving.set(false); }, error: (e: { detail?: string }) => { this.saving.set(false); this.actionError.set(e.detail || 'Issue could not be saved.'); } }); }
  protected transition(): void { const i = this.issue(); const next = this.nextStatus(); if (!i || !next) return; this.actionError.set(''); this.issues.transition(i.id, next).subscribe({ next: (updated) => this.issueResource.set(updated), error: (e: { detail?: string }) => this.actionError.set(e.detail || 'Status could not be changed.') }); }
  protected archive(): void { const i = this.issue(); if (!i || !this.isManager()) return; this.issues.archive(i.id).subscribe({ next: () => { this.issueResource.reload(); }, error: (e: { detail?: string }) => this.actionError.set(e.detail || 'Issue could not be archived.') }); }
  protected addComment(event: Event): void { event.preventDefault(); const i = this.issue(); const body = this.commentBody().trim(); if (!i || !body) return; this.commentsApi.create(i.id, body).subscribe({ next: (comment) => { this.comments.update((items) => [...items, comment]); this.commentBody.set(''); }, error: (e: { detail?: string }) => this.actionError.set(e.detail || 'Comment could not be added.') }); }
  protected startEditComment(comment: Comment): void { this.editingCommentId.set(comment.id); this.editingCommentBody.set(comment.body || ''); }
  protected saveComment(comment: Comment): void { const i = this.issue(); if (!i) return; this.commentsApi.update(i.id, comment.id, this.editingCommentBody().trim()).subscribe({ next: (updated) => { this.comments.update((items) => items.map((item) => item.id === updated.id ? updated : item)); this.editingCommentId.set(null); }, error: (e: { detail?: string }) => this.actionError.set(e.detail || 'Comment could not be updated.') }); }
  protected deleteComment(comment: Comment): void { const i = this.issue(); if (!i) return; this.commentsApi.delete(i.id, comment.id).subscribe({ next: (updated) => this.comments.update((items) => items.map((item) => item.id === updated.id ? updated : item)), error: (e: { detail?: string }) => this.actionError.set(e.detail || 'Comment could not be deleted.') }); }
  protected canDeleteComment(comment: Comment): boolean { const u = this.session.user(); return !!u && (comment.author.id === u.id || this.isManager()); }
  protected retry(): void { this.issueResource.reload(); }
  private loadRelated(issueId: number): void { this.commentsApi.list(issueId).subscribe({ next: (page: Page<Comment>) => this.comments.set(page.results), error: () => this.comments.set([]) }); this.activityApi.issueFeed(issueId).subscribe({ next: (page: Page<Activity>) => this.activity.set(page.results), error: () => this.activity.set([]) }); }
}

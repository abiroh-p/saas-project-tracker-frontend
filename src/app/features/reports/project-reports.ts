import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import type { AssigneeWorkloadReport, PriorityDistributionReport, ProjectOverviewReport, StatusDistributionReport, TrendsReport } from '../../core/api/models';
import { ReportsService } from './reports.service';
import { ProjectContext } from '../projects/project-context';
import { apiErrorOf } from '../../core/http/resource-error';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

interface ProjectReportsData { overview: ProjectOverviewReport; status: StatusDistributionReport; priority: PriorityDistributionReport; workload: AssigneeWorkloadReport; trends: TrendsReport }
@Component({ selector: 'app-project-reports', imports: [EmptyState], changeDetection: ChangeDetectionStrategy.OnPush, styleUrl: './project-reports.scss', template: `
  <header><div><h2>Project reports</h2><p>Issue progress and team workload.</p></div><button type="button" (click)="refresh()">Refresh</button></header>
  @if (data(); as report) {
    <section class="metrics"> <article><span>Total issues</span><strong>{{ report.overview.total_issues }}</strong></article><article><span>In progress</span><strong>{{ report.overview.in_progress_issues }}</strong></article><article><span>Completed</span><strong>{{ report.overview.completed_issues }}</strong></article><article><span>Overdue</span><strong>{{ report.overview.overdue_issues }}</strong></article><article><span>Completion</span><strong>{{ report.overview.completion_rate }}%</strong></article></section>
    <div class="columns"><section><h3>Status</h3><ul>@for (row of report.status.results; track row.status) { <li><span>{{ row.label }}</span><strong>{{ row.count }}</strong></li> }</ul></section><section><h3>Priority</h3><ul>@for (row of report.priority.results; track row.priority) { <li><span>{{ row.label }}</span><strong>{{ row.count }}</strong></li> }</ul></section></div>
    <section><h3>Assignee workload</h3>@if (report.workload.results.length) { <div class="table-wrap"><table><thead><tr><th>Assignee</th><th>Issues</th><th>Open</th><th>In progress</th><th>Done</th><th>Overdue</th></tr></thead><tbody>@for (row of report.workload.results; track row.assignee_id ?? 'unassigned') { <tr><td>{{ row.full_name || row.username || 'Unassigned' }}</td><td>{{ row.assigned_issues }}</td><td>{{ row.open_issues }}</td><td>{{ row.in_progress_issues }}</td><td>{{ row.completed_issues }}</td><td>{{ row.overdue_issues }}</td></tr> }</tbody></table></div> } @else { <p>No issue workload to report.</p> }</section>
    <section><h3>Last 30 days</h3><div class="table-wrap"><table><thead><tr><th>Period</th><th>Created</th><th>Completed</th></tr></thead><tbody>@for (row of report.trends.results; track row.period) { <tr><td>{{ row.period }}</td><td>{{ row.created_count }}</td><td>{{ row.completed_count }}</td></tr> }</tbody></table></div></section>
  } @else if (error(); as err) { <app-empty-state icon="circle-alert" heading="Reports could not be loaded" [description]="err.detail"><button actions type="button" (click)="refresh()">Try again</button></app-empty-state> } @else { <p aria-busy="true">Loading reports…</p> }
` })
export class ProjectReports {
  protected readonly context = inject(ProjectContext);
  private readonly service = inject(ReportsService);
  private readonly refreshKey = signal(0);
  protected readonly resource = rxResource<ProjectReportsData, { id: number; refresh: number } | undefined>({ params: () => { const id = this.context.projectId(); return id ? { id, refresh: this.refreshKey() } : undefined; }, stream: ({ params }) => {
    const today = new Date(); const to = today.toISOString().slice(0, 10); const fromDate = new Date(today); fromDate.setDate(today.getDate() - 29); const from = fromDate.toISOString().slice(0, 10);
    return forkJoin({ overview: this.service.overview(params.id), status: this.service.statusDistribution(params.id), priority: this.service.priorityDistribution(params.id), workload: this.service.assigneeWorkload(params.id), trends: this.service.trends(params.id, from, to) });
  } });
  protected readonly data = computed(() => this.resource.hasValue() ? this.resource.value() : null);
  protected readonly error = computed(() => apiErrorOf(this.resource.error()));
  protected refresh(): void { this.refreshKey.update((n) => n + 1); }
}

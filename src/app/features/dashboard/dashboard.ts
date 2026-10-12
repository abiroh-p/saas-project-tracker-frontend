import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import type { Dashboard, DashboardIssue, IssueStatus } from '../../core/api/models';
import { DashboardService } from './dashboard.service';
import { apiErrorOf } from '../../core/http/resource-error';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { ISSUE_STATUS_LABELS } from '../../core/api/models';

@Component({
  selector: 'app-dashboard', imports: [EmptyState, PageHeader, RouterLink, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush, styleUrl: './dashboard.scss', templateUrl: './dashboard.html',
})
export class DashboardPage {
  private readonly service = inject(DashboardService);
  private readonly refreshKey = signal(0);
  private readonly resource = rxResource<Dashboard, number>({
    params: () => this.refreshKey(),
    stream: () => this.service.get(),
  });
  protected readonly data = computed(() => this.resource.hasValue() ? this.resource.value() : null);
  protected readonly error = computed(() => apiErrorOf(this.resource.error()));
  protected readonly loading = this.resource.isLoading;
  protected readonly statuses: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  protected readonly labels = ISSUE_STATUS_LABELS;
  protected retry(): void { this.refreshKey.update((key) => key + 1); }
  protected issueLink(issue: DashboardIssue): string[] { return ['/issues', issue.id.toString()]; }
}

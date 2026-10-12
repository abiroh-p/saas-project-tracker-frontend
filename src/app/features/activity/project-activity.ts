import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Activity, Page } from '../../core/api/models';
import { ActivityService } from './activity.service';
import { ProjectContext } from '../projects/project-context';
import { apiErrorOf } from '../../core/http/resource-error';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../shared/ui/pagination/pagination';

@Component({ selector: 'app-project-activity', imports: [DatePipe, EmptyState, Pagination], changeDetection: ChangeDetectionStrategy.OnPush, styleUrl: './project-activity.scss', template: `
  <h2>Project activity</h2>
  @if (data(); as result) { @if (!result.count) { <app-empty-state heading="No activity yet" description="Project and issue events will appear here." /> } @else { <ol>@for (item of result.results; track item.id) { <li><p>{{ item.description }}</p><small>{{ item.user.username }} · {{ item.created_at | date:'medium' }}</small></li> }</ol><app-pagination [page]="page()" [pageSize]="20" [count]="result.count" (pageChange)="page.set($event)" /> } } @else if (error(); as err) { <app-empty-state icon="circle-alert" heading="Activity could not be loaded" [description]="err.detail"><button actions type="button" (click)="resource.reload()">Try again</button></app-empty-state> } @else { <p aria-busy="true">Loading activity…</p> }
` })
export class ProjectActivity {
  protected readonly context = inject(ProjectContext);
  private readonly service = inject(ActivityService);
  protected readonly page = signal(1);
  protected readonly resource = rxResource<Page<Activity>, { id: number; page: number } | undefined>({ params: () => { const id = this.context.projectId(); return id ? { id, page: this.page() } : undefined; }, stream: ({ params }) => this.service.projectFeed(params.id, params.page) });
  protected readonly data = computed(() => this.resource.hasValue() ? this.resource.value() : null);
  protected readonly error = computed(() => apiErrorOf(this.resource.error()));
}

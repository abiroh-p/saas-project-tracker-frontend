import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { AssigneeWorkloadReport, PriorityDistributionReport, ProjectOverviewReport, StatusDistributionReport, TrendsReport } from '../../core/api/models';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private url(projectId: number, path: string): string { return `${this.baseUrl}/projects/${projectId}/reports/${path}/`; }
  overview(id: number): Observable<ProjectOverviewReport> { return this.http.get<ProjectOverviewReport>(this.url(id, 'overview')); }
  statusDistribution(id: number): Observable<StatusDistributionReport> { return this.http.get<StatusDistributionReport>(this.url(id, 'status-distribution')); }
  priorityDistribution(id: number): Observable<PriorityDistributionReport> { return this.http.get<PriorityDistributionReport>(this.url(id, 'priority-distribution')); }
  assigneeWorkload(id: number): Observable<AssigneeWorkloadReport> { return this.http.get<AssigneeWorkloadReport>(this.url(id, 'assignee-workload')); }
  trends(id: number, dateFrom: string, dateTo: string, interval: 'day' | 'week' = 'day'): Observable<TrendsReport> {
    const params = new HttpParams().set('date_from', dateFrom).set('date_to', dateTo).set('interval', interval);
    return this.http.get<TrendsReport>(this.url(id, 'trends'), { params });
  }
}

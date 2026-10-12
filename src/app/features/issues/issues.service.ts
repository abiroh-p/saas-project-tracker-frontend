import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Issue, IssueFilters, IssueStatus, IssueWrite, Page } from '../../core/api/models';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class IssuesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly base = `${this.baseUrl}/issues`;
  list(page: number, pageSize: number, filters: IssueFilters = {}): Observable<Page<Issue>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params = params.set(key, value);
    return this.http.get<Page<Issue>>(`${this.base}/`, { params });
  }
  listForProject(projectId: number, page: number, pageSize: number, filters: IssueFilters = {}): Observable<Page<Issue>> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize);
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params = params.set(key, value);
    return this.http.get<Page<Issue>>(`${this.baseUrl}/projects/${projectId}/issues/`, { params });
  }
  create(projectId: number, body: IssueWrite): Observable<Issue> { return this.http.post<Issue>(`${this.baseUrl}/projects/${projectId}/issues/`, body); }
  get(id: number): Observable<Issue> { return this.http.get<Issue>(`${this.base}/${id}/`); }
  update(id: number, changes: Partial<IssueWrite>): Observable<Issue> { return this.http.patch<Issue>(`${this.base}/${id}/`, changes); }
  transition(id: number, status: IssueStatus): Observable<Issue> { return this.http.post<Issue>(`${this.base}/${id}/transition/`, { status }); }
  archive(id: number): Observable<void> { return this.http.post(`${this.base}/${id}/archive/`, {}).pipe(map(() => undefined)); }
}

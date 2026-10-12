import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { Page, Project, ProjectWrite } from '../../core/api/models';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/projects`;

  /** Projects the signed-in user is a member of, newest first. */
  list(page: number, pageSize: number, search = ''): Observable<Page<Project>> {
    return this.http.get<Page<Project>>(`${this.baseUrl}/`, {
      params: search ? { page, page_size: pageSize, search } : { page, page_size: pageSize },
    });
  }

  get(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}/`);
  }

  create(project: ProjectWrite): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/`, project);
  }

  update(id: number, changes: Partial<ProjectWrite>): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}/`, changes);
  }

  archive(id: number): Observable<void> {
    return this.http.post(`${this.baseUrl}/${id}/archive/`, {}).pipe(map(() => undefined));
  }
}

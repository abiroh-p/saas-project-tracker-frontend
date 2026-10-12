import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { AddProjectMemberRequest, ProjectMember, ProjectRole } from '../../core/api/models';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class ProjectMembersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private url(projectId: number, memberId?: number): string {
    const members = `${this.baseUrl}/projects/${projectId}/members/`;
    return memberId === undefined ? members : `${members}${memberId}/`;
  }

  list(projectId: number): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(this.url(projectId));
  }

  add(projectId: number, request: AddProjectMemberRequest): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(this.url(projectId), request);
  }

  changeRole(projectId: number, memberId: number, role: ProjectRole): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(this.url(projectId, memberId), { role });
  }

  /** Removes a member, or lets the signed-in user leave when `memberId` is their own membership. */
  remove(projectId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(this.url(projectId, memberId));
  }
}

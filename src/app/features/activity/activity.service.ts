import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { Activity, Page } from '../../core/api/models';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  projectFeed(projectId: number, page = 1): Observable<Page<Activity>> { return this.http.get<Page<Activity>>(`${this.baseUrl}/projects/${projectId}/activity/`, { params: { page, page_size: 20 } }); }
  issueFeed(issueId: number, page = 1): Observable<Page<Activity>> { return this.http.get<Page<Activity>>(`${this.baseUrl}/issues/${issueId}/activity/`, { params: { page, page_size: 20 } }); }
}

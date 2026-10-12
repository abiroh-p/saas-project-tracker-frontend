import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { Comment, Page } from '../../core/api/models';
import { API_BASE_URL } from '../../core/config/api';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private url(issueId: number): string { return `${this.baseUrl}/issues/${issueId}/comments/`; }
  list(issueId: number, page = 1): Observable<Page<Comment>> { return this.http.get<Page<Comment>>(this.url(issueId), { params: { page, page_size: 20 } }); }
  create(issueId: number, body: string): Observable<Comment> { return this.http.post<Comment>(this.url(issueId), { body }); }
  update(issueId: number, commentId: number, body: string): Observable<Comment> { return this.http.patch<Comment>(`${this.url(issueId)}${commentId}/`, { body }); }
  delete(issueId: number, commentId: number): Observable<Comment> { return this.http.delete<Comment>(`${this.url(issueId)}${commentId}/`); }
}

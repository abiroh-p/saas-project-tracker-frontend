import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { UserSummary } from '../api/models';
import { API_BASE_URL } from '../config/api';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/accounts`;

  /** Finds active users by name or username (at least 2 characters, up to 10 results). */
  search(term: string): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users/`, { params: { search: term } });
  }
}

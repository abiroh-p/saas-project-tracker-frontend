import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import type { ProfileUpdate, User } from '../api/models';
import { API_BASE_URL } from '../config/api';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/accounts`;
  private readonly session = inject(SessionStore);

  /** Updates the signed-in user's profile and refreshes the session so the UI reflects it. */
  update(changes: ProfileUpdate): Observable<User> {
    return this.http
      .patch<User>(`${this.baseUrl}/profile/`, changes)
      .pipe(tap((user) => this.session.setUser(user)));
  }
}

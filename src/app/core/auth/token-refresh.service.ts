import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api';
import { TokenStorageService } from './token-storage.service';

interface RefreshResponse {
  access: string;
  refresh?: string;
}

/**
 * Exchanges the refresh token for a new access token.
 *
 * - Uses `HttpBackend` so the request bypasses interceptors (no recursion on a 401).
 * - Single-flight: concurrent callers share one in-flight request.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly tokens = inject(TokenStorageService);

  private inflight: Observable<string> | null = null;

  refresh(): Observable<string> {
    if (this.inflight) {
      return this.inflight;
    }

    const refresh = this.tokens.refreshToken;
    if (!refresh) {
      return throwError(() => new Error('No refresh token available.'));
    }

    this.inflight = this.http
      .post<RefreshResponse>(`${this.baseUrl}/accounts/token/refresh/`, { refresh })
      .pipe(
        tap((response) => this.tokens.update(response)),
        map((response) => response.access),
        finalize(() => (this.inflight = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.inflight;
  }
}

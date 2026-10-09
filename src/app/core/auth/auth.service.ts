import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../api/models';
import { API_BASE_URL } from '../config/api';
import { SessionStore } from './session.store';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/accounts`;
  private readonly tokens = inject(TokenStorageService);
  private readonly session = inject(SessionStore);

  /** Signs in and stores the tokens. `remember` keeps the session across browser restarts. */
  login(request: LoginRequest, remember: boolean): Observable<User> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login/`, request).pipe(
      tap((response) => {
        this.tokens.save({ access: response.access, refresh: response.refresh }, remember);
        this.session.setUser(response.user);
      }),
      map((response) => response.user),
    );
  }

  /** Creates an account. It does not sign the user in. */
  register(request: RegisterRequest): Observable<User> {
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/register/`, request)
      .pipe(map((response) => response.user));
  }

  /** Blacklists the refresh token on the server (best effort) and always clears the local session. */
  logout(): Observable<void> {
    const refresh = this.tokens.refreshToken;
    const clear = () => {
      this.tokens.clear();
      this.session.clear();
    };

    if (!refresh) {
      clear();
      return of(undefined);
    }

    return this.http.post(`${this.baseUrl}/logout/`, { refresh }).pipe(
      catchError(() => of(null)),
      tap(clear),
      map(() => undefined),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post(`${this.baseUrl}/change-password/`, request).pipe(map(() => undefined));
  }

  /** Called once at startup: restores the user if a stored session is still valid. */
  restoreSession(): Promise<void> {
    if (!this.tokens.hasSession()) {
      return Promise.resolve();
    }

    return firstValueFrom(
      this.http.get<User>(`${this.baseUrl}/me/`).pipe(
        tap((user) => this.session.setUser(user)),
        catchError(() => {
          this.tokens.clear();
          this.session.clear();
          return of(null);
        }),
        map(() => undefined),
      ),
    );
  }
}

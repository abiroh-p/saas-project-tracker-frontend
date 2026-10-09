import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api';
import { SessionStore } from './session.store';
import { TokenRefreshService } from './token-refresh.service';
import { TokenStorageService } from './token-storage.service';

const PUBLIC_ENDPOINTS = ['/accounts/login/', '/accounts/register/', '/accounts/token/refresh/'];

/**
 * Attaches the access token to API requests. On a 401 it refreshes the token once and retries the
 * request; if the refresh fails the session is cleared and the user is sent to sign in.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const tokens = inject(TokenStorageService);
  const refresher = inject(TokenRefreshService);
  const session = inject(SessionStore);
  const router = inject(Router);

  if (!req.url.startsWith(baseUrl) || PUBLIC_ENDPOINTS.some((path) => req.url.endsWith(path))) {
    return next(req);
  }

  return next(withToken(req, tokens.accessToken)).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!unauthorized || !tokens.refreshToken) {
        return throwError(() => error);
      }

      return refresher.refresh().pipe(
        catchError(() => {
          const wasSignedIn = session.isAuthenticated();
          tokens.clear();
          session.clear();
          if (wasSignedIn) {
            void router.navigate(['/sign-in'], {
              queryParams: { returnUrl: router.url, reason: 'expired' },
            });
          }
          return throwError(() => error);
        }),
        switchMap((access) => next(withToken(req, access))),
      );
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

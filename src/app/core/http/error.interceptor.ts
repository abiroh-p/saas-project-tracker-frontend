import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { normalizeError } from './api-error';

/**
 * Outermost interceptor: turns every failed request into an `ApiError`.
 * It must run *after* the auth interceptor sees the raw 401 (see `app.config.ts` ordering).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: unknown) => throwError(() => normalizeError(error))));

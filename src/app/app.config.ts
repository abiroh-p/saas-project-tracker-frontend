import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { AuthService, authInterceptor } from './core/auth';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // Order matters: the first interceptor is outermost. `authInterceptor` must see the raw 401 to
    // refresh the token, and `errorInterceptor` then normalises whatever is left.
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor, authInterceptor])),
    // Restore the signed-in user (if a stored session is still valid) before the first navigation.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};

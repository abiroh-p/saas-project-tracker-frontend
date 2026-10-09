import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/** Protects pages that need a signed-in user; remembers where the user wanted to go. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(SessionStore).isAuthenticated()) {
    return true;
  }
  const returnUrl = state.url && state.url !== '/' ? { returnUrl: state.url } : {};
  return inject(Router).createUrlTree(['/sign-in'], { queryParams: returnUrl });
};

/** Keeps signed-in users away from sign-in / sign-up. */
export const guestGuard: CanActivateFn = () =>
  inject(SessionStore).isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;

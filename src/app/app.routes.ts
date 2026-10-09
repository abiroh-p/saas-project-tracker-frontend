import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth';

export const routes: Routes = [
  // Living style guide, development only.
  ...(isDevMode()
    ? [
        {
          path: 'design-system',
          title: 'Design system · ProjectTracker',
          loadComponent: () =>
            import('./features/design-system/design-system').then((m) => m.DesignSystem),
        },
      ]
    : []),
  {
    path: 'sign-in',
    title: 'Sign in · ProjectTracker',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'sign-up',
    title: 'Create account · ProjectTracker',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/sign-up/sign-up').then((m) => m.SignUp),
  },
  {
    path: 'dashboard',
    title: 'Dashboard · ProjectTracker',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];

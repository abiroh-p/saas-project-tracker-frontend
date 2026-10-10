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
    // Everything below needs a signed-in user and renders inside the app shell.
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · ProjectTracker',
        data: {
          heading: 'Dashboard',
          description: 'Your projects and issues at a glance will appear here soon.',
        },
        loadComponent: () =>
          import('./features/placeholder/page-placeholder').then((m) => m.PagePlaceholder),
      },
      {
        path: 'projects',
        title: 'Projects · ProjectTracker',
        data: { heading: 'Projects', description: 'Project management is coming next.' },
        loadComponent: () =>
          import('./features/placeholder/page-placeholder').then((m) => m.PagePlaceholder),
      },
      {
        path: 'issues',
        title: 'Issues · ProjectTracker',
        data: { heading: 'Issues', description: 'Issue tracking is coming soon.' },
        loadComponent: () =>
          import('./features/placeholder/page-placeholder').then((m) => m.PagePlaceholder),
      },
      {
        path: 'settings',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'profile' },
          {
            path: 'profile',
            title: 'Profile settings · ProjectTracker',
            loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
          },
          {
            path: 'account',
            title: 'Change password · ProjectTracker',
            loadComponent: () => import('./features/account/account').then((m) => m.Account),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

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
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'projects',
        children: [
          {
            path: '',
            pathMatch: 'full',
            title: 'Projects · ProjectTracker',
            loadComponent: () =>
              import('./features/projects/project-list/project-list').then((m) => m.ProjectList),
          },
          {
            // The page title is set once the project has loaded (see ProjectDetail).
            path: ':projectId',
            loadComponent: () =>
              import('./features/projects/project-detail/project-detail').then(
                (m) => m.ProjectDetail,
              ),
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'overview' },
              {
                path: 'overview',
                loadComponent: () =>
                  import('./features/projects/project-overview/project-overview').then(
                    (m) => m.ProjectOverview,
                  ),
              },
              {
                path: 'members',
                loadComponent: () =>
                  import('./features/projects/project-members/project-members').then(
                    (m) => m.ProjectMembers,
                  ),
              },
              {
                path: 'issues',
                loadComponent: () => import('./features/projects/project-issues').then((m) => m.ProjectIssues),
              },
              {
                path: 'activity',
                loadComponent: () => import('./features/activity/project-activity').then((m) => m.ProjectActivity),
              },
              {
                path: 'reports',
                loadComponent: () => import('./features/reports/project-reports').then((m) => m.ProjectReports),
              },
            ],
          },
        ],
      },
      {
        path: 'issues',
        title: 'Issues · ProjectTracker',
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./features/issues/issue-list').then((m) => m.IssueList) },
          { path: ':issueId', loadComponent: () => import('./features/issues/issue-detail').then((m) => m.IssueDetail) },
        ],
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

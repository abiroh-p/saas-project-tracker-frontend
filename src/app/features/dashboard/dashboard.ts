import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SessionStore } from '../../core/auth';
import { Button } from '../../shared/ui/button/button';
import { Logo } from '../../shared/ui/logo/logo';

/** Placeholder landing page so the auth flow has somewhere to go. Replaced by the real dashboard. */
@Component({
  selector: 'app-dashboard',
  imports: [Button, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-8);
    }
  `,
  template: `
    <app-logo />
    <h1>Welcome, {{ session.displayName() }}</h1>
    <p>You are signed in as {{ session.user()?.email }}. The dashboard is coming next.</p>
    <button app-button type="button" variant="secondary" (click)="signOut()">Sign out</button>
  `,
})
export class Dashboard {
  protected readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/sign-in'));
  }
}

import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, SessionStore } from '../../core/auth';
import { Avatar } from '../../shared/ui/avatar/avatar';
import { Icon } from '../../shared/ui/icon/icon';

/** Account dropdown in the top bar. Keyboard navigation and focus handling come from the CDK menu. */
@Component({
  selector: 'app-user-menu',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, RouterLink, Avatar, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './user-menu.scss',
  template: `
    <button type="button" class="user-button" aria-label="Account menu" [cdkMenuTriggerFor]="menu">
      <app-avatar [name]="session.displayName()" [size]="34" />
      <span class="user-button__name">{{ session.displayName() }}</span>
      <app-icon name="chevron-down" [size]="16" />
    </button>

    <ng-template #menu>
      <div class="menu" cdkMenu>
        <div class="menu__header" role="presentation">
          <strong>{{ session.displayName() }}</strong>
          <span>{{ session.user()?.email }}</span>
        </div>
        <a class="menu__item" cdkMenuItem routerLink="/settings/profile">
          <app-icon name="user" [size]="16" />
          Profile settings
        </a>
        <a class="menu__item" cdkMenuItem routerLink="/settings/account">
          <app-icon name="lock" [size]="16" />
          Change password
        </a>
        <div class="menu__divider" role="separator"></div>
        <button type="button" class="menu__item" cdkMenuItem (click)="signOut()">
          <app-icon name="log-out" [size]="16" />
          Sign out
        </button>
      </div>
    </ng-template>
  `,
})
export class UserMenu {
  protected readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/sign-in'));
  }
}

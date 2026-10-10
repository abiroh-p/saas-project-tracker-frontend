import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Icon } from '../../shared/ui/icon/icon';
import { Logo } from '../../shared/ui/logo/logo';
import { MAIN_NAV, SETTINGS_NAV } from './nav-items';
import { UserMenu } from './user-menu';

/**
 * Frame for every signed-in page: navy sidebar, top bar with the account menu, and the routed
 * content. Below 1024px the sidebar becomes a drawer opened from the top bar.
 */
@Component({
  selector: 'app-shell',
  imports: [Icon, Logo, RouterLink, RouterLinkActive, RouterOutlet, UserMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeNav()' },
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  protected readonly mainNav = MAIN_NAV;
  protected readonly settingsNav = SETTINGS_NAV;
  protected readonly navOpen = signal(false);

  constructor() {
    // The drawer closes whenever the user navigates.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.closeNav());
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  /** In-page anchors conflict with `<base href>`, so the skip link moves focus programmatically. */
  protected skipToContent(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}

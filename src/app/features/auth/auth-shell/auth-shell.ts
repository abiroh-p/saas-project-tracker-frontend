import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Logo } from '../../../shared/ui/logo/logo';

/**
 * Page frame shared by sign-in and sign-up: brand panel on the left (hidden on small screens) and a
 * card on the right. Project the form as the default content and a link row with `footer`:
 * `<p footer>No account? <a routerLink="/sign-up">Sign up</a></p>`.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  readonly heading = input.required<string>();
  readonly subheading = input('');
}

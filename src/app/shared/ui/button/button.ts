import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger-outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button styles applied to native `<button>` and `<a>` elements so semantics, focus and keyboard
 * behaviour stay native: `<button app-button variant="primary" [loading]="saving()">Save</button>`.
 *
 * While `loading` the button is non-interactive and announced as busy. Handlers should still guard
 * against double submits because pressing Enter in a form can bypass pointer events.
 */
@Component({
  selector: 'button[app-button], a[app-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn',
    '[class.btn--primary]': "variant() === 'primary'",
    '[class.btn--secondary]': "variant() === 'secondary'",
    '[class.btn--ghost]': "variant() === 'ghost'",
    '[class.btn--danger-outline]': "variant() === 'danger-outline'",
    '[class.btn--sm]': "size() === 'sm'",
    '[class.btn--lg]': "size() === 'lg'",
    '[class.btn--block]': 'block()',
    '[class.is-loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? true : null',
  },
  styleUrl: './button.scss',
  template: `
    @if (loading()) {
      <span class="btn__spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false);
  readonly loading = input(false);
}

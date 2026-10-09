import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** ProjectTracker mark and wordmark. Use `inverse` on dark backgrounds. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'logo',
    '[class.logo--inverse]': 'inverse()',
    '[attr.aria-label]': "'ProjectTracker'",
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-strong);
      font-weight: 700;
      letter-spacing: -0.015em;
    }
    :host(.logo--inverse) {
      color: var(--color-white);
    }
    .logo__text {
      font-size: var(--text-lg);
      line-height: 1;
    }
  `,
  template: `
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 32"
      [attr.width]="size()"
      [attr.height]="size()"
    >
      <rect width="32" height="32" rx="8" fill="#1664f1" />
      <path
        fill="#fff"
        fill-rule="evenodd"
        d="M11 8h6.4a5 5 0 0 1 0 10H15v6h-4V8Zm4 3.6v3.2h2.2a1.6 1.6 0 0 0 0-3.2H15Z"
      />
    </svg>
    @if (!compact()) {
      <span class="logo__text">ProjectTracker</span>
    }
  `,
})
export class Logo {
  readonly inverse = input(false);
  readonly compact = input(false);
  readonly size = input(32);
}

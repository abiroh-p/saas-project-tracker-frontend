import { ChangeDetectionStrategy, Component } from '@angular/core';

/** White surface used to group related content or a form. */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: var(--space-6);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      background: var(--bg-surface);
      box-shadow: var(--shadow-card);
    }

    @media (max-width: 40rem) {
      :host {
        padding: var(--space-4);
      }
    }
  `,
  template: `<ng-content />`,
})
export class Card {}

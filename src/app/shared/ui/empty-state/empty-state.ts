import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

/** Centered message for empty or failed lists. Put a call to action in the `actions` slot. */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-12) var(--space-6);
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-lg);
      background: var(--bg-surface);
      text-align: center;
    }
    .empty__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-full);
      background: var(--color-primary-50);
      color: var(--color-primary-600);
    }
    h2 {
      font-size: var(--text-lg);
    }
    p {
      max-width: 28rem;
      color: var(--text-muted);
    }
    .empty__actions {
      margin-top: var(--space-2);
    }
  `,
  template: `
    <span class="empty__icon"><app-icon [name]="icon()" [size]="22" /></span>
    <h2>{{ heading() }}</h2>
    @if (description()) {
      <p>{{ description() }}</p>
    }
    <div class="empty__actions"><ng-content select="[actions]" /></div>
  `,
})
export class EmptyState {
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly icon = input<IconName>('folder');
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/** Small status label: roles, priorities, project keys. */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'badge badge--' + variant()" },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      line-height: 1.5;
      white-space: nowrap;
    }
    :host(.badge--neutral) {
      background: var(--color-neutral-100);
      color: var(--color-neutral-600);
    }
    :host(.badge--primary) {
      background: var(--color-primary-50);
      color: var(--color-primary-700);
    }
    :host(.badge--success) {
      background: var(--color-success-50);
      color: #17692a;
    }
    :host(.badge--warning) {
      background: var(--color-warning-50);
      color: #8a5207;
    }
    :host(.badge--danger) {
      background: var(--color-danger-50);
      color: var(--color-danger-700);
    }
  `,
  template: `<ng-content />`,
})
export class Badge {
  readonly variant = input<BadgeVariant>('neutral');
}

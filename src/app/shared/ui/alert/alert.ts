import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

const ICON_BY_VARIANT: Record<AlertVariant, IconName> = {
  error: 'circle-alert',
  success: 'circle-check',
  info: 'info',
  warning: 'triangle-alert',
};

/** Inline message banner. Errors are announced assertively, everything else politely. */
@Component({
  selector: 'app-alert',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'alert alert--' + variant()",
    '[attr.role]': "variant() === 'error' ? 'alert' : 'status'",
  },
  styleUrl: './alert.scss',
  template: `
    <app-icon class="alert__icon" [name]="icon()" [size]="18" />
    <div class="alert__body"><ng-content /></div>
  `,
})
export class Alert {
  readonly variant = input<AlertVariant>('info');

  protected readonly icon = computed(() => ICON_BY_VARIANT[this.variant()]);
}

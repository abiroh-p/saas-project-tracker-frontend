import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { ToastKind, ToastService } from './toast.service';

const ICONS: Record<ToastKind, IconName> = {
  success: 'circle-check',
  error: 'circle-alert',
  info: 'info',
};

/** Fixed stack of toasts. Errors are announced assertively, everything else politely. */
@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './toast-container.scss',
  template: `
    <div class="toasts">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.kind }}"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
        >
          <app-icon class="toast__icon" [name]="icon(toast.kind)" [size]="18" />
          <p class="toast__message">{{ toast.message }}</p>
          <button
            type="button"
            class="toast__close"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly toasts = inject(ToastService);

  protected icon(kind: ToastKind): IconName {
    return ICONS[kind];
  }
}

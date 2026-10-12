import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '../button/button';
import { Modal } from './modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
}

/** Yes/no dialog. Closes with `true` when confirmed and `false` otherwise. Use `DialogService.confirm()`. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    p {
      color: var(--text-default);
      line-height: var(--leading-normal);
    }
  `,
  template: `
    <app-modal [heading]="options.title" (closed)="ref.close(false)">
      <p>{{ options.message }}</p>
      <ng-container footer>
        <button app-button type="button" variant="ghost" (click)="ref.close(false)">
          {{ options.cancelLabel ?? 'Cancel' }}
        </button>
        <button
          app-button
          type="button"
          [variant]="options.danger ? 'danger' : 'primary'"
          (click)="ref.close(true)"
        >
          {{ options.confirmLabel ?? 'Confirm' }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class ConfirmDialog {
  protected readonly options = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

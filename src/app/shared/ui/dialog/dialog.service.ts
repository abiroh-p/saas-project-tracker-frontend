import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmOptions } from './confirm-dialog';

export interface OpenOptions<D> {
  data?: D;
  /** Accessible name announced when the dialog opens. */
  ariaLabel: string;
}

/**
 * Opens dialogs with app defaults: focus is trapped and restored, Escape and backdrop clicks close it.
 * Dialog components render an `<app-modal>` and close themselves through their injected `DialogRef`.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    options: OpenOptions<D>,
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(component, {
      data: options.data,
      ariaLabel: options.ariaLabel,
      hasBackdrop: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      maxWidth: '100vw',
    });
  }

  /** Resolves with `true` only when the user explicitly confirms. */
  confirm(options: ConfirmOptions): Observable<boolean> {
    return this.open<boolean, ConfirmOptions>(ConfirmDialog, {
      data: options,
      ariaLabel: options.title,
    }).closed.pipe(map((result) => result === true));
  }
}

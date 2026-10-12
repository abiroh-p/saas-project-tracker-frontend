import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const LIFETIME_MS: Record<ToastKind, number> = {
  success: 4000,
  info: 5000,
  error: 8000,
};

/** App-wide transient notifications. Rendered by `<app-toast-container>` in the app shell. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  private nextId = 1;

  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(kind: ToastKind, message: string): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), LIFETIME_MS[kind]);
  }
}

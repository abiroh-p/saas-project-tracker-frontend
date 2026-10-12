import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Visual frame for dialog content: title, close button, body and a `footer` slot for actions.
 * The dialog container (focus trap, backdrop, Escape to close) comes from `DialogService`.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './modal.scss',
  template: `
    <div class="modal">
      <header class="modal__header">
        <h2 class="modal__title">{{ heading() }}</h2>
        <button
          type="button"
          class="modal__close"
          aria-label="Close dialog"
          (click)="closed.emit()"
        >
          <app-icon name="x" [size]="18" />
        </button>
      </header>

      <div class="modal__body"><ng-content /></div>

      <footer class="modal__footer"><ng-content select="[footer]" /></footer>
    </div>
  `,
})
export class Modal {
  readonly heading = input.required<string>();
  readonly closed = output<void>();
}

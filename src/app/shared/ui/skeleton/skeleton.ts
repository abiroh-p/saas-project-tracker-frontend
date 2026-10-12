import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Loading placeholder block. Hidden from assistive tech; the parent announces loading itself. */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  styles: `
    :host {
      display: block;
      border-radius: var(--radius-sm);
      background: linear-gradient(
        90deg,
        var(--color-neutral-100) 25%,
        var(--color-neutral-200) 37%,
        var(--color-neutral-100) 63%
      );
      background-size: 400% 100%;
      animation: skeleton-shimmer 1.4s ease infinite;
    }
    @keyframes skeleton-shimmer {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }
  `,
  template: '',
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
}

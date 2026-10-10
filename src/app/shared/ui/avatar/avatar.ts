import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initialsOf } from './initials';

/** Circular avatar showing a person's initials. The full name is exposed to assistive tech. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'fontSize()',
  },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      background: var(--color-neutral-200);
      color: var(--color-neutral-600);
      font-weight: 600;
      letter-spacing: 0.01em;
      user-select: none;
    }
  `,
  template: `{{ initials() }}`,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input(36);

  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly fontSize = computed(() => Math.round(this.size() * 0.38));
}

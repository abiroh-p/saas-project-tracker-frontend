import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, IconName } from './icons';

type IconNode = ReadonlyArray<readonly [string, Readonly<Record<string, string | number>>]>;

/** Renders a Lucide icon inline. Decorative by default (`aria-hidden`). */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'app-icon' },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.stroke-width]="strokeWidth()"
    >
      @for (node of nodes(); track $index) {
        @switch (node[0]) {
          @case ('path') {
            <path [attr.d]="node[1]['d']" />
          }
          @case ('circle') {
            <circle [attr.cx]="node[1]['cx']" [attr.cy]="node[1]['cy']" [attr.r]="node[1]['r']" />
          }
          @case ('rect') {
            <rect
              [attr.x]="node[1]['x']"
              [attr.y]="node[1]['y']"
              [attr.width]="node[1]['width']"
              [attr.height]="node[1]['height']"
              [attr.rx]="node[1]['rx']"
            />
          }
          @case ('line') {
            <line
              [attr.x1]="node[1]['x1']"
              [attr.y1]="node[1]['y1']"
              [attr.x2]="node[1]['x2']"
              [attr.y2]="node[1]['y2']"
            />
          }
          @case ('polyline') {
            <polyline [attr.points]="node[1]['points']" />
          }
          @case ('polygon') {
            <polygon [attr.points]="node[1]['points']" />
          }
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(2);

  protected readonly nodes = computed<IconNode>(() => ICONS[this.name()] as unknown as IconNode);
}

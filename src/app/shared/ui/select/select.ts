import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FieldBase } from '../field/field-base';
import { Icon } from '../icon/icon';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Labelled native `<select>` for reactive forms. Native keeps keyboard, screen reader and mobile
 * behaviour for free. Use `hideLabel` for compact inline use (the label stays for assistive tech).
 */
@Component({
  selector: 'app-select',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select extends FieldBase {
  readonly options = input.required<readonly SelectOption[]>();
  readonly hideLabel = input(false);
  readonly size = input<'sm' | 'md'>('md');

  /** Emits only when the user picks an option, never for programmatic form updates. */
  readonly selectionChange = output<string>();

  protected handleChange(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    this.updateValue(next);
    this.selectionChange.emit(next);
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FieldBase } from '../field/field-base';

/** Labelled multi-line input for reactive forms. Shows a character counter when `maxlength` is set. */
@Component({
  selector: 'app-text-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-area.html',
  styleUrl: './text-area.scss',
})
export class TextArea extends FieldBase {
  readonly placeholder = input('');
  readonly rows = input(4);
  readonly maxlength = input<number | null>(null);

  protected handleInput(event: Event): void {
    this.updateValue((event.target as HTMLTextAreaElement).value);
  }
}

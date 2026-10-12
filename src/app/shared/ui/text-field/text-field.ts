import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FieldBase } from '../field/field-base';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

/**
 * Labelled text input that plugs into reactive forms (`formControlName` / `[formControl]`).
 *
 * Validation messages appear once the control is touched and invalid. Server errors set through
 * `applyServerErrors()` are shown the same way. Password fields get a show/hide toggle.
 */
@Component({
  selector: 'app-text-field',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
})
export class TextField extends FieldBase {
  readonly type = input<'text' | 'email' | 'password' | 'search' | 'date'>('text');
  readonly placeholder = input('');
  readonly icon = input<IconName | null>(null);
  readonly autocomplete = input<string | null>(null);
  readonly maxlength = input<number | null>(null);
  /** Displays the text in capitals (the form value is unchanged; normalise on submit). */
  readonly uppercase = input(false);

  protected readonly revealed = signal(false);

  protected readonly effectiveType = computed(() =>
    this.type() === 'password' && this.revealed() ? 'text' : this.type(),
  );

  protected handleInput(event: Event): void {
    this.updateValue((event.target as HTMLInputElement).value);
  }

  protected toggleReveal(): void {
    this.revealed.update((revealed) => !revealed);
  }
}

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';

/** Checkbox with projected label: `<app-checkbox formControlName="remember">Remember me</app-checkbox>`. */
@Component({
  selector: 'app-checkbox',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: Checkbox, multi: true }],
  styleUrl: './checkbox.scss',
  template: `
    <label class="checkbox" [class.checkbox--disabled]="disabled()">
      <input
        class="checkbox__input"
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="handleChange($event)"
        (blur)="onTouched()"
      />
      <span class="checkbox__box" aria-hidden="true">
        <app-icon name="check" [size]="12" [strokeWidth]="3.5" />
      </span>
      <span class="checkbox__label"><ng-content /></span>
    </label>
  `,
})
export class Checkbox implements ControlValueAccessor {
  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected handleChange(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
  }
}

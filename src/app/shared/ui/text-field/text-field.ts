import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { firstErrorMessage } from '../../../core/forms/error-messages';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

let nextId = 0;

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
export class TextField implements ControlValueAccessor, AfterContentInit {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'search'>('text');
  readonly placeholder = input('');
  readonly icon = input<IconName | null>(null);
  readonly hint = input<string | null>(null);
  readonly autocomplete = input<string | null>(null);

  protected readonly id = `app-field-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly revealed = signal(false);

  /** Bumped whenever the bound control changes state so OnPush re-evaluates the error message. */
  private readonly controlVersion = signal(0);

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly effectiveType = computed(() =>
    this.type() === 'password' && this.revealed() ? 'text' : this.type(),
  );

  protected readonly errorMessage = computed(() => {
    this.controlVersion();
    const control = this.ngControl?.control;
    if (!control || !control.touched || !control.invalid) {
      return null;
    }
    return firstErrorMessage(control.errors, this.label());
  });

  protected readonly describedBy = computed(() => {
    if (this.errorMessage()) {
      return `${this.id}-error`;
    }
    return this.hint() ? `${this.id}-hint` : null;
  });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterContentInit(): void {
    this.ngControl?.control?.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.controlVersion.update((version) => version + 1));
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected handleInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected handleBlur(): void {
    this.onTouched();
  }

  protected toggleReveal(): void {
    this.revealed.update((revealed) => !revealed);
  }
}

import {
  AfterContentInit,
  DestroyRef,
  Directive,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { firstErrorMessage } from '../../../core/forms/error-messages';

let nextId = 0;

/**
 * Shared behaviour for labelled form controls (`TextField`, `TextArea`, `Select`): value access for
 * reactive forms, disabled state, and the validation message that appears once the bound control is
 * touched and invalid (server errors set through `applyServerErrors()` included).
 */
@Directive()
export abstract class FieldBase implements ControlValueAccessor, AfterContentInit {
  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);

  protected readonly id = `app-field-${nextId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  /** Bumped whenever the bound control changes state so OnPush re-evaluates the error message. */
  private readonly controlVersion = signal(0);

  protected readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

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

  /** Call from the template when the native control's value changes. */
  protected updateValue(next: string): void {
    this.value.set(next);
    this.onChange(next);
  }

  /** Call from the template when the native control loses focus. */
  protected markTouched(): void {
    this.onTouched();
  }
}

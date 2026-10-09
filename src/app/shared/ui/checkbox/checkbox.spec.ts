import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Checkbox } from './checkbox';

@Component({
  imports: [ReactiveFormsModule, Checkbox],
  template: `<app-checkbox [formControl]="control">Remember me</app-checkbox>`,
})
class Host {
  control = new FormControl(true, { nonNullable: true });
}

describe('Checkbox', () => {
  it('reflects the form value and projects its label', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('input')!.checked).toBe(true);
    expect(el.textContent).toContain('Remember me');
  });

  it('updates the form control when toggled', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    input.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe(false);
  });

  it('can be disabled from the form', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.control.disable();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('input')!.disabled).toBe(true);
  });
});

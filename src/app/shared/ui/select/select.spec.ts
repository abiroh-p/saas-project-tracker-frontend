import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from './select';

@Component({
  imports: [ReactiveFormsModule, Select],
  template: `
    <app-select
      label="Role"
      hint="Pick one."
      [options]="options"
      [formControl]="control"
      (selectionChange)="picked.push($event)"
    />
  `,
})
class Host {
  options = [
    { value: 'A', label: 'Alpha' },
    { value: 'B', label: 'Beta' },
  ];
  control = new FormControl('A', { nonNullable: true, validators: [Validators.required] });
  picked: string[] = [];
}

describe('Select', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, el, select: el.querySelector('select')! };
  }

  it('renders options, the label and the current value', async () => {
    const { el, select } = await render();
    expect(el.querySelector('label')!.textContent).toContain('Role');
    expect(Array.from(select.options).map((o) => o.textContent?.trim())).toEqual(['Alpha', 'Beta']);
    expect(select.value).toBe('A');
    expect(el.textContent).toContain('Pick one.');
  });

  it('updates the form and emits selectionChange when the user picks an option', async () => {
    const { fixture, select } = await render();

    select.value = 'B';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe('B');
    expect(fixture.componentInstance.picked).toEqual(['B']);
  });

  it('reflects programmatic changes without emitting selectionChange', async () => {
    const { fixture, select } = await render();

    fixture.componentInstance.control.setValue('B');
    await fixture.whenStable();

    expect(select.value).toBe('B');
    expect(fixture.componentInstance.picked).toEqual([]);
  });

  it('can be reset after the user picked something else', async () => {
    const { fixture, select } = await render();
    select.value = 'B';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    fixture.componentInstance.control.setValue('A');
    await fixture.whenStable();

    expect(select.value).toBe('A');
  });

  it('disables the native select with the form control', async () => {
    const { fixture, select } = await render();
    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(select.disabled).toBe(true);
  });
});

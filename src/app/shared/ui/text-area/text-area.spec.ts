import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextArea } from './text-area';

@Component({
  imports: [ReactiveFormsModule, TextArea],
  template: `<app-text-area label="Description" [maxlength]="20" [formControl]="control" />`,
})
class Host {
  control = new FormControl('hello', { nonNullable: true });
}

describe('TextArea', () => {
  it('shows the value, label and a character counter', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('textarea')!.value).toBe('hello');
    expect(el.querySelector('label')!.textContent).toContain('Description');
    expect(el.textContent).toContain('5/20');
    expect(el.querySelector('textarea')!.getAttribute('maxlength')).toBe('20');
  });

  it('writes typed text to the form control and updates the counter', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const textarea = el.querySelector('textarea')!;

    textarea.value = 'hello world';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBe('hello world');
    expect(el.textContent).toContain('11/20');
  });
});

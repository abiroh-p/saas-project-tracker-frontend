import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <button app-button id="a" variant="secondary" size="lg" [block]="true">Save</button>
    <button app-button id="b" [loading]="true">Saving</button>
    <a app-button id="c" variant="ghost" href="/x">Link</a>
  `,
})
class Host {}

describe('Button', () => {
  const query = (fixture: { nativeElement: HTMLElement }, id: string) =>
    fixture.nativeElement.querySelector<HTMLElement>(`#${id}`)!;

  it('applies variant, size and block modifiers and projects its label', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const button = query(fixture, 'a');
    expect(button.classList).toContain('btn--secondary');
    expect(button.classList).toContain('btn--lg');
    expect(button.classList).toContain('btn--block');
    expect(button.textContent?.trim()).toBe('Save');
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('shows a spinner and aria-busy while loading', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const button = query(fixture, 'b');
    expect(button.classList).toContain('is-loading');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.btn__spinner')).not.toBeNull();
  });

  it('works on anchors', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const link = query(fixture, 'c');
    expect(link.tagName).toBe('A');
    expect(link.classList).toContain('btn--ghost');
  });
});

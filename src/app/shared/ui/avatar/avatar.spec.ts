import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('shows initials, exposes the full name and applies the size', async () => {
    const fixture = TestBed.createComponent(Avatar);
    fixture.componentRef.setInput('name', 'John Doe');
    fixture.componentRef.setInput('size', 80);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent?.trim()).toBe('JD');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('John Doe');
    expect(el.style.width).toBe('80px');
    expect(el.style.height).toBe('80px');
  });
});

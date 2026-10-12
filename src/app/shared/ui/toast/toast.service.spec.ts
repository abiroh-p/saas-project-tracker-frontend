import { TestBed } from '@angular/core/testing';
import { ToastContainer } from './toast-container';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('adds toasts of each kind and dismisses them on demand', () => {
    const toast = TestBed.inject(ToastService);

    toast.success('Saved.');
    toast.error('Failed.');
    toast.info('FYI.');

    expect(toast.toasts().map((t) => [t.kind, t.message])).toEqual([
      ['success', 'Saved.'],
      ['error', 'Failed.'],
      ['info', 'FYI.'],
    ]);

    toast.dismiss(toast.toasts()[1].id);
    expect(toast.toasts().map((t) => t.kind)).toEqual(['success', 'info']);
  });

  it('removes toasts automatically, keeping errors on screen longer', () => {
    const toast = TestBed.inject(ToastService);
    toast.success('Saved.');
    toast.error('Failed.');

    vi.advanceTimersByTime(4000);
    expect(toast.toasts().map((t) => t.kind)).toEqual(['error']);

    vi.advanceTimersByTime(4000);
    expect(toast.toasts()).toEqual([]);
  });
});

describe('ToastContainer', () => {
  it('renders toasts with the right live-region role and a dismiss button', async () => {
    vi.useFakeTimers();
    const toast = TestBed.inject(ToastService);
    const fixture = TestBed.createComponent(ToastContainer);

    toast.success('Saved.');
    toast.error('Failed.');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const items = Array.from(el.querySelectorAll('.toast'));
    expect(items.map((item) => item.getAttribute('role'))).toEqual(['status', 'alert']);
    expect(items[0].textContent).toContain('Saved.');

    el.querySelector<HTMLButtonElement>('.toast__close')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.toast')).toHaveLength(1);
    vi.useRealTimers();
  });
});

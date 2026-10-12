import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  async function render(page: number, pageSize: number, count: number) {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('count', count);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const buttons = () => Array.from(el.querySelectorAll('button'));
    return { fixture, el, buttons };
  }

  it('shows the visible range and enables Next on the first page', async () => {
    const { el, buttons } = await render(1, 12, 30);
    expect(el.textContent).toContain('Showing 1–12 of 30');
    expect(buttons()[0].disabled).toBe(true); // Previous
    expect(buttons()[1].disabled).toBe(false); // Next
  });

  it('clips the range on the last page and disables Next', async () => {
    const { el, buttons } = await render(3, 12, 30);
    expect(el.textContent).toContain('Showing 25–30 of 30');
    expect(buttons()[1].disabled).toBe(true);
  });

  it('emits the requested page', async () => {
    const { fixture, buttons } = await render(2, 12, 30);
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));

    buttons()[0].click();
    buttons()[1].click();

    expect(emitted).toEqual([1, 3]);
  });

  it('hides the buttons when everything fits on one page and renders nothing when empty', async () => {
    expect((await render(1, 12, 5)).buttons()).toHaveLength(0);
    expect((await render(1, 12, 0)).el.textContent?.trim()).toBe('');
  });
});

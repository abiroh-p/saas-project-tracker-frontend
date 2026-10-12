import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from '../button/button';

/** "Showing 1–12 of 40" with previous / next buttons for page-number pagination. */
@Component({
  selector: 'app-pagination',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      margin-top: var(--space-6);
      color: var(--text-muted);
    }
    .pagination__buttons {
      display: flex;
      gap: var(--space-2);
    }
  `,
  template: `
    @if (count() > 0) {
      <p aria-live="polite">Showing {{ from() }}–{{ to() }} of {{ count() }}</p>
      @if (pageCount() > 1) {
        <nav class="pagination__buttons" aria-label="Pagination">
          <button
            app-button
            type="button"
            variant="secondary"
            size="sm"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            Previous
          </button>
          <button
            app-button
            type="button"
            variant="secondary"
            size="sm"
            [disabled]="page() >= pageCount()"
            (click)="pageChange.emit(page() + 1)"
          >
            Next
          </button>
        </nav>
      }
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly count = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.count() / this.pageSize())),
  );
  protected readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.page() * this.pageSize(), this.count()));
}

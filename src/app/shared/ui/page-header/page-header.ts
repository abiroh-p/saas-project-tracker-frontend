import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page title block. Project actions on the right with the `actions` attribute:
 * `<button actions app-button>New project</button>`.
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    p {
      margin-top: var(--space-1);
      color: var(--text-muted);
    }

    @media (max-width: 40rem) {
      h1 {
        font-size: var(--text-2xl);
      }
    }
  `,
  template: `
    <div>
      <h1>{{ heading() }}</h1>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
    <ng-content select="[actions]" />
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
}

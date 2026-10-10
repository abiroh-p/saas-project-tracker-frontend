import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Card } from '../../shared/ui/card/card';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/**
 * Stand-in for areas that are still being built. Configure it from the route:
 * `data: { heading: 'Projects', description: '…' }` (bound through `withComponentInputBinding`).
 */
@Component({
  selector: 'app-page-placeholder',
  imports: [Card, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    app-card {
      max-width: 40rem;
    }

    p {
      color: var(--text-muted);
    }
  `,
  template: `
    <app-page-header [heading]="heading()" />
    <app-card>
      <p>{{ description() }}</p>
    </app-card>
  `,
})
export class PagePlaceholder {
  readonly heading = input.required<string>();
  readonly description = input('This section is being built and will appear here soon.');
}

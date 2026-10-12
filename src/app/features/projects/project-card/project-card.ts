import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PROJECT_ROLE_LABELS, type Project } from '../../../core/api/models';
import { Badge } from '../../../shared/ui/badge/badge';
import { Icon } from '../../../shared/ui/icon/icon';
import { formatDateRange } from '../date-range';

/** One project in the list: key, role, name, a short description and its dates. */
@Component({
  selector: 'app-project-card',
  imports: [RouterLink, Badge, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-card.scss',
  template: `
    <a class="card" [routerLink]="['/projects', project().id]">
      <div class="card__top">
        <app-badge variant="primary">{{ project().key }}</app-badge>
        @if (roleLabel(); as role) {
          <app-badge>{{ role }}</app-badge>
        }
      </div>

      <h2 class="card__name">{{ project().name }}</h2>
      <p class="card__description" [class.card__description--empty]="!project().description">
        {{ project().description || 'No description' }}
      </p>

      <p class="card__dates">
        <app-icon name="calendar" [size]="14" />
        {{ dates() }}
      </p>
    </a>
  `,
})
export class ProjectCard {
  readonly project = input.required<Project>();

  protected readonly roleLabel = computed(() => {
    const role = this.project().my_role;
    return role ? PROJECT_ROLE_LABELS[role] : null;
  });

  protected readonly dates = computed(() =>
    formatDateRange(this.project().start_date, this.project().end_date),
  );
}

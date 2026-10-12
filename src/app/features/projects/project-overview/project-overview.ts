import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PROJECT_ROLE_LABELS } from '../../../core/api/models';
import { Card } from '../../../shared/ui/card/card';
import { ProjectContext } from '../project-context';

@Component({
  selector: 'app-project-overview',
  imports: [Card, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './project-overview.scss',
  templateUrl: './project-overview.html',
})
export class ProjectOverview {
  protected readonly project = inject(ProjectContext).project;

  protected readonly roleLabel = computed(() => {
    const role = this.project()?.my_role;
    return role ? PROJECT_ROLE_LABELS[role] : '—';
  });
}

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Project } from '../../../core/api/models';
import { ProjectContext } from '../project-context';
import { ProjectOverview } from './project-overview';

const project: Project = {
  id: 7,
  key: 'WR',
  name: 'Website Redesign',
  description: 'Line one\nLine two',
  start_date: '2026-10-01',
  end_date: null,
  created_by: 'john.doe',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-05T10:00:00Z',
  is_archived: false,
  my_role: 'VIEWER',
};

async function render(value: Project) {
  TestBed.configureTestingModule({
    providers: [{ provide: ProjectContext, useValue: { project: signal(value) } }],
  });
  const fixture = TestBed.createComponent(ProjectOverview);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ProjectOverview', () => {
  it('shows the description and the project details', async () => {
    const el = await render(project);

    expect(el.textContent).toContain('Line one');
    expect(el.textContent).toContain('WR');
    expect(el.textContent).toContain('Oct 1, 2026');
    expect(el.textContent).toContain('Not set'); // end date
    expect(el.textContent).toContain('john.doe');
    expect(el.textContent).toContain('Viewer');
  });

  it('says so when there is no description', async () => {
    const el = await render({ ...project, description: '' });
    expect(el.textContent).toContain('No description yet.');
  });
});

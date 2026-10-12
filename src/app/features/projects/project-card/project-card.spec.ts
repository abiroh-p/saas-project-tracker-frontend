import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Project } from '../../../core/api/models';
import { ProjectCard } from './project-card';

const base: Project = {
  id: 7,
  key: 'WR',
  name: 'Website Redesign',
  description: 'Refresh the marketing site.',
  start_date: '2026-10-01',
  end_date: '2026-12-31',
  created_by: 'john.doe',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  is_archived: false,
  my_role: 'TEAM_MEMBER',
};

async function render(project: Project) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ProjectCard);
  fixture.componentRef.setInput('project', project);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('ProjectCard', () => {
  it('links to the project and shows key, role, name, description and dates', async () => {
    const el = await render(base);

    expect(el.querySelector('a')!.getAttribute('href')).toBe('/projects/7');
    expect(el.textContent).toContain('WR');
    expect(el.textContent).toContain('Team Member');
    expect(el.querySelector('h2')!.textContent).toBe('Website Redesign');
    expect(el.textContent).toContain('Refresh the marketing site.');
    expect(el.textContent).toContain('Oct 1, 2026 – Dec 31, 2026');
  });

  it('handles a missing description, dates and role', async () => {
    const el = await render({
      ...base,
      description: '',
      start_date: null,
      end_date: null,
      my_role: null,
    });

    expect(el.textContent).toContain('No description');
    expect(el.textContent).toContain('No dates set');
    expect(el.textContent).not.toContain('Team Member');
  });
});

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Page, Project } from '../../../core/api/models';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { settle } from '../../../testing/settle';
import { ProjectList } from './project-list';

const project = (id: number, key: string, name: string): Project => ({
  id,
  key,
  name,
  description: `${name} description`,
  start_date: null,
  end_date: null,
  created_by: 'john.doe',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  is_archived: false,
  my_role: 'PROJECT_MANAGER',
});

const page = (results: Project[], count = results.length): Page<Project> => ({
  count,
  next: null,
  previous: null,
  results,
});

const isList = (n: number) => (req: { url: string; params: { get(k: string): string | null } }) =>
  req.url === '/api/v1/projects/' && req.params.get('page') === String(n);

describe('ProjectList', () => {
  let fixture: ComponentFixture<ProjectList>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  const dialogs = { open: vi.fn() };

  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: DialogService, useValue: dialogs },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectList);
    el = fixture.nativeElement;
    await settle(fixture);
  }

  beforeEach(() => dialogs.open.mockReset());
  afterEach(() => httpMock.verify());

  it('shows a loading skeleton, then the projects as cards', async () => {
    await setup();
    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();

    httpMock
      .expectOne(isList(1))
      .flush(page([project(1, 'WR', 'Website Redesign'), project(2, 'API', 'Public API')]));
    await settle(fixture);

    expect(el.querySelector('[aria-busy="true"]')).toBeNull();
    const cards = Array.from(el.querySelectorAll('app-project-card'));
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Website Redesign');
    expect(cards[0].textContent).toContain('WR');
    expect(cards[0].querySelector('a')!.getAttribute('href')).toBe('/projects/1');
  });

  it('asks for 12 projects per page', async () => {
    await setup();
    const req = httpMock.expectOne(isList(1));
    expect(req.request.params.get('page_size')).toBe('12');
    req.flush(page([]));
  });

  it('shows an empty state with a create action', async () => {
    await setup();
    httpMock.expectOne(isList(1)).flush(page([]));
    await settle(fixture);

    expect(el.textContent).toContain('No projects yet');
    expect(el.querySelectorAll('app-project-card')).toHaveLength(0);
  });

  it('pages through results', async () => {
    await setup();
    httpMock.expectOne(isList(1)).flush(page([project(1, 'A1', 'One')], 25));
    await settle(fixture);

    expect(el.textContent).toContain('Showing 1–12 of 25');

    Array.from(el.querySelectorAll('app-pagination button'))
      .find((b) => b.textContent?.includes('Next'))!
      .dispatchEvent(new Event('click'));
    await settle(fixture);

    httpMock.expectOne(isList(2)).flush(page([project(13, 'B1', 'Thirteen')], 25));
    await settle(fixture);
    expect(el.textContent).toContain('Thirteen');
    expect(el.textContent).toContain('Showing 13–24 of 25');
  });

  it('falls back to page 1 when the current page no longer exists', async () => {
    await setup();
    httpMock.expectOne(isList(1)).flush(page([project(1, 'A1', 'One')], 25));
    await settle(fixture);
    Array.from(el.querySelectorAll('app-pagination button'))
      .find((b) => b.textContent?.includes('Next'))!
      .dispatchEvent(new Event('click'));
    await settle(fixture);

    httpMock
      .expectOne(isList(2))
      .flush(
        { detail: 'Invalid page.', code: 'not_found' },
        { status: 404, statusText: 'Not Found' },
      );
    await settle(fixture);

    httpMock.expectOne(isList(1)).flush(page([project(1, 'A1', 'One')], 12));
    await settle(fixture);
    expect(el.textContent).toContain('One');
  });

  it('explains a failed load and retries', async () => {
    await setup();
    httpMock
      .expectOne(isList(1))
      .flush(
        { detail: 'Something broke.', code: 'server_error' },
        { status: 500, statusText: 'Server Error' },
      );
    await settle(fixture);

    expect(el.textContent).toContain('Projects could not be loaded');
    expect(el.textContent).toContain('Something broke.');

    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Try again'))!
      .click();
    await settle(fixture);

    httpMock.expectOne(isList(1)).flush(page([project(1, 'WR', 'Website Redesign')]));
    await settle(fixture);
    expect(el.textContent).toContain('Website Redesign');
  });

  it('creating a project confirms and opens it', async () => {
    await setup();
    httpMock.expectOne(isList(1)).flush(page([]));
    await settle(fixture);

    const created = project(9, 'NEW', 'Brand New');
    dialogs.open.mockReturnValue({ closed: of(created) });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('New project'))!
      .click();

    expect(navigate).toHaveBeenCalledWith(['/projects', 9]);
    expect(
      TestBed.inject(ToastService)
        .toasts()
        .map((t) => t.message),
    ).toContain('Project NEW created.');
  });

  it('does nothing when the create dialog is cancelled', async () => {
    await setup();
    httpMock.expectOne(isList(1)).flush(page([]));
    await settle(fixture);

    dialogs.open.mockReturnValue({ closed: of(undefined) });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    Array.from(el.querySelectorAll('button'))
      .find((b) => b.textContent?.includes('New project'))!
      .click();

    expect(navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(ToastService).toasts()).toEqual([]);
  });
});

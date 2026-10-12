import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Project, ProjectRole } from '../../../core/api/models';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { settle } from '../../../testing/settle';
import { ProjectDetail } from './project-detail';

const URL = '/api/v1/projects/7/';

const project = (role: ProjectRole | null = 'PROJECT_MANAGER'): Project => ({
  id: 7,
  key: 'WR',
  name: 'Website Redesign',
  description: '',
  start_date: null,
  end_date: null,
  created_by: 'john.doe',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  is_archived: false,
  my_role: role,
});

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  const dialogs = { open: vi.fn(), confirm: vi.fn() };

  async function setup(projectId: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: DialogService, useValue: dialogs },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('projectId', projectId);
    el = fixture.nativeElement;
    await settle(fixture);
  }

  const loaded = async (role: ProjectRole | null = 'PROJECT_MANAGER') => {
    await setup('7');
    httpMock.expectOne(URL).flush(project(role));
    await settle(fixture);
  };
  const buttonLabelled = (label: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(label));

  beforeEach(() => {
    dialogs.open.mockReset();
    dialogs.confirm.mockReset();
  });
  afterEach(() => httpMock.verify());

  it('shows a loading state, then the project header and tabs', async () => {
    await setup('7');
    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();

    httpMock.expectOne(URL).flush(project());
    await settle(fixture);

    expect(el.querySelector('[aria-busy="true"]')).toBeNull();
    expect(el.querySelector('h1')!.textContent).toBe('Website Redesign');
    expect(el.textContent).toContain('WR');
    expect(el.textContent).toContain('Project Manager');
    const tabs = Array.from(el.querySelectorAll('.tab')).map((tab) => tab.textContent?.trim());
    expect(tabs).toEqual(['Overview', 'Issues', 'Members', 'Activity', 'Reports']);
    expect(el.querySelector('.back')!.getAttribute('href')).toBe('/projects');
  });

  it('sets the page title once loaded', async () => {
    await loaded();
    expect(TestBed.inject(Title).getTitle()).toBe('WR · Website Redesign · ProjectTracker');
  });

  it('offers Edit and Archive to project managers', async () => {
    await loaded('PROJECT_MANAGER');
    expect(buttonLabelled('Edit')).toBeDefined();
    expect(buttonLabelled('Archive')).toBeDefined();
  });

  it.each<ProjectRole>(['TEAM_MEMBER', 'VIEWER'])(
    'hides Edit and Archive from a %s',
    async (role) => {
      await loaded(role);
      expect(buttonLabelled('Edit')).toBeUndefined();
      expect(buttonLabelled('Archive')).toBeUndefined();
    },
  );

  it('shows "not found" for a project the user cannot open', async () => {
    await setup('7');
    httpMock
      .expectOne(URL)
      .flush({ detail: 'Not found.', code: 'not_found' }, { status: 404, statusText: 'Not Found' });
    await settle(fixture);

    expect(el.textContent).toContain('Project not found');
    expect(el.textContent).toContain('archived');
    expect(el.querySelector('a[href="/projects"]')).not.toBeNull();
  });

  it.each(['abc', '0', '-3', '1.5'])(
    'shows "not found" for the invalid id %j without a request',
    async (id) => {
      await setup(id);
      httpMock.expectNone(() => true);
      expect(el.textContent).toContain('Project not found');
    },
  );

  it('shows other failures with their message', async () => {
    await setup('7');
    httpMock
      .expectOne(URL)
      .flush(
        { detail: 'Server is down.', code: 'server_error' },
        { status: 500, statusText: 'Server Error' },
      );
    await settle(fixture);

    expect(el.textContent).toContain('The project could not be loaded');
    expect(el.textContent).toContain('Server is down.');
  });

  it('reloads when the route id changes', async () => {
    await loaded();
    fixture.componentRef.setInput('projectId', '8');
    await settle(fixture);

    httpMock.expectOne('/api/v1/projects/8/').flush({ ...project(), id: 8, name: 'Other' });
    await settle(fixture);
    expect(el.querySelector('h1')!.textContent).toBe('Other');
  });

  it('applies an edit made in the dialog', async () => {
    await loaded();
    dialogs.open.mockReturnValue({ closed: of({ ...project(), name: 'Marketing Website' }) });

    buttonLabelled('Edit')!.click();
    await settle(fixture);

    expect(dialogs.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: { project: expect.objectContaining({ id: 7 }) } }),
    );
    expect(el.querySelector('h1')!.textContent).toBe('Marketing Website');
    expect(
      TestBed.inject(ToastService)
        .toasts()
        .map((t) => t.message),
    ).toContain('Project updated.');
  });

  it('keeps everything as is when the edit dialog is cancelled', async () => {
    await loaded();
    dialogs.open.mockReturnValue({ closed: of(undefined) });

    buttonLabelled('Edit')!.click();
    await settle(fixture);

    expect(el.querySelector('h1')!.textContent).toBe('Website Redesign');
    expect(TestBed.inject(ToastService).toasts()).toEqual([]);
  });

  it('archives after confirmation and returns to the list', async () => {
    await loaded();
    dialogs.confirm.mockReturnValue(of(true));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    buttonLabelled('Archive')!.click();
    expect(dialogs.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Archive this project?', danger: true }),
    );

    const req = httpMock.expectOne(`${URL}archive/`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Project archived successfully.' });

    expect(navigate).toHaveBeenCalledWith('/projects');
    expect(
      TestBed.inject(ToastService)
        .toasts()
        .map((t) => t.message),
    ).toContain('Project WR archived.');
  });

  it('does not archive when the confirmation is declined', async () => {
    await loaded();
    dialogs.confirm.mockReturnValue(of(false));

    buttonLabelled('Archive')!.click();

    httpMock.expectNone(`${URL}archive/`);
  });

  it('reports an archive failure and stays on the page', async () => {
    await loaded();
    dialogs.confirm.mockReturnValue(of(true));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

    buttonLabelled('Archive')!.click();
    httpMock
      .expectOne(`${URL}archive/`)
      .flush(
        { detail: 'Only project managers can archive.', code: 'permission_denied' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(navigate).not.toHaveBeenCalled();
    expect(
      TestBed.inject(ToastService)
        .toasts()
        .map((t) => t.message),
    ).toContain('Only project managers can archive.');
  });
});

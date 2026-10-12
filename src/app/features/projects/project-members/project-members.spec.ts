import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { Project, ProjectMember, ProjectRole } from '../../../core/api/models';
import { SessionStore } from '../../../core/auth';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { DialogService } from '../../../shared/ui/dialog/dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { settle } from '../../../testing/settle';
import { ProjectContext } from '../project-context';
import { ProjectMembers } from './project-members';

const MEMBERS_URL = '/api/v1/projects/7/members/';

const project = (role: ProjectRole): Project => ({
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

const member = (id: number, userId: number, name: string, role: ProjectRole): ProjectMember => ({
  id,
  user_id: userId,
  username: name.toLowerCase().replace(' ', '.'),
  full_name: name,
  email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  role,
  created_at: '2026-10-02T10:00:00Z',
});

const MEMBERS = [
  member(11, 1, 'John Doe', 'PROJECT_MANAGER'),
  member(12, 2, 'Jane Roe', 'TEAM_MEMBER'),
];

describe('ProjectMembers', () => {
  let fixture: ComponentFixture<ProjectMembers>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  let toast: ToastService;
  const dialogs = { confirm: vi.fn(), open: vi.fn() };

  async function setup(myRole: ProjectRole) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ProjectContext,
          useValue: {
            project: signal(project(myRole)),
            canManage: signal(myRole === 'PROJECT_MANAGER'),
          },
        },
        { provide: DialogService, useValue: dialogs },
      ],
    });

    TestBed.inject(SessionStore).setUser({
      id: 1,
      username: 'john.doe',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      role: 'TEAM_MEMBER',
    });
    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);

    fixture = TestBed.createComponent(ProjectMembers);
    el = fixture.nativeElement;
    await settle(fixture);
    httpMock.expectOne(MEMBERS_URL).flush(MEMBERS);
    await settle(fixture);
  }

  const rowOf = (name: string) =>
    Array.from(el.querySelectorAll('tbody tr')).find((row) => row.textContent?.includes(name))!;
  const selectOf = (name: string) => rowOf(name).querySelector('select')!;
  const choose = async (select: HTMLSelectElement, value: string) => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await settle(fixture);
  };

  beforeEach(() => {
    dialogs.confirm.mockReset();
    dialogs.open.mockReset();
  });

  afterEach(() => httpMock.verify());

  describe('as a project manager', () => {
    beforeEach(() => setup('PROJECT_MANAGER'));

    it('lists members with names, emails, roles and the current user marked', () => {
      expect(el.textContent).toContain('2 members');
      expect(rowOf('John Doe').textContent).toContain('(you)');
      expect(rowOf('Jane Roe').textContent).toContain('jane.roe@example.com');
      expect(selectOf('John Doe').value).toBe('PROJECT_MANAGER');
      expect(selectOf('Jane Roe').value).toBe('TEAM_MEMBER');
    });

    it('shows Add member, Leave on own row and Remove on others', () => {
      expect(el.textContent).toContain('Add member');
      expect(rowOf('John Doe').textContent).toContain('Leave');
      expect(rowOf('Jane Roe').textContent).toContain('Remove');
    });

    it('changes a role and confirms', async () => {
      await choose(selectOf('Jane Roe'), 'VIEWER');

      const req = httpMock.expectOne(`${MEMBERS_URL}12/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ role: 'VIEWER' });
      req.flush({ ...MEMBERS[1], role: 'VIEWER' });
      await settle(fixture);

      expect(toast.toasts().map((t) => t.message)).toContain('Jane Roe is now Viewer.');
      httpMock.expectOne(MEMBERS_URL).flush([MEMBERS[0], { ...MEMBERS[1], role: 'VIEWER' }]);
      await settle(fixture);
      expect(selectOf('Jane Roe').value).toBe('VIEWER');
    });

    it('snaps the select back and shows the reason when the server refuses a role change', async () => {
      await choose(selectOf('John Doe'), 'VIEWER');

      httpMock
        .expectOne(`${MEMBERS_URL}11/`)
        .flush(
          { detail: 'A project must have at least one project manager.', code: 'bad_request' },
          { status: 400, statusText: 'Bad Request' },
        );
      await settle(fixture);

      expect(toast.toasts().map((t) => t.message)).toContain(
        'A project must have at least one project manager.',
      );

      // Nothing changed on the server, so there is no reload; the select just shows the saved role.
      httpMock.expectNone(MEMBERS_URL);
      expect(selectOf('John Doe').value).toBe('PROJECT_MANAGER');
    });

    it('removes a member after confirmation and reloads the list', async () => {
      dialogs.confirm.mockReturnValue(of(true));

      rowOf('Jane Roe').querySelector<HTMLButtonElement>('button')!.click();
      await settle(fixture);

      expect(dialogs.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Remove this member?', danger: true }),
      );
      const req = httpMock.expectOne(`${MEMBERS_URL}12/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await settle(fixture);

      expect(toast.toasts().map((t) => t.message)).toContain(
        'Jane Roe was removed from the project.',
      );
      httpMock.expectOne(MEMBERS_URL).flush([MEMBERS[0]]);
    });

    it('does nothing when the confirmation is declined', async () => {
      dialogs.confirm.mockReturnValue(of(false));

      rowOf('Jane Roe').querySelector<HTMLButtonElement>('button')!.click();
      await settle(fixture);

      httpMock.expectNone(`${MEMBERS_URL}12/`);
    });

    it('opens the add-member dialog with the people already in the project', async () => {
      dialogs.open.mockReturnValue({ closed: of(undefined) });

      const addButton = Array.from(el.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Add member'),
      )!;
      addButton.click();

      expect(dialogs.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { projectId: 7, existingUserIds: [1, 2] } }),
      );
    });

    it('reloads and confirms after a member was added', async () => {
      dialogs.open.mockReturnValue({ closed: of(member(13, 3, 'Sam Lee', 'VIEWER')) });

      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Add member'))!
        .click();
      await settle(fixture);

      expect(toast.toasts().map((t) => t.message)).toContain('Sam Lee was added to the project.');
      httpMock.expectOne(MEMBERS_URL).flush([...MEMBERS, member(13, 3, 'Sam Lee', 'VIEWER')]);
      await settle(fixture);
      expect(el.textContent).toContain('3 members');
    });
  });

  describe('as a regular member', () => {
    beforeEach(() => setup('TEAM_MEMBER'));

    it('is read-only except for leaving', () => {
      expect(el.textContent).not.toContain('Add member');
      expect(el.querySelectorAll('tbody select')).toHaveLength(0);
      expect(rowOf('Jane Roe').textContent).not.toContain('Remove');
      expect(rowOf('John Doe').textContent).toContain('Leave');
      expect(rowOf('Jane Roe').textContent).toContain('Team Member');
    });
  });
});

describe('ProjectMembers loading failure', () => {
  it('offers a retry', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ProjectContext,
          useValue: { project: signal(project('PROJECT_MANAGER')), canManage: signal(true) },
        },
        { provide: DialogService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(ProjectMembers);
    const httpMock = TestBed.inject(HttpTestingController);
    await settle(fixture);

    httpMock
      .expectOne(MEMBERS_URL)
      .flush(
        { detail: 'Something broke.', code: 'server_error' },
        { status: 500, statusText: 'Server Error' },
      );
    await settle(fixture);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Members could not be loaded');
    const retry = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Try again'),
    )!;
    retry.click();
    await settle(fixture);

    httpMock.expectOne(MEMBERS_URL).flush(MEMBERS);
    await settle(fixture);
    expect(el.textContent).toContain('2 members');
  });
});

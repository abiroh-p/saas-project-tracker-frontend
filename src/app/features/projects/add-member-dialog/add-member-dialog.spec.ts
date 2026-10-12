import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ProjectMember, UserSummary } from '../../../core/api/models';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { settle } from '../../../testing/settle';
import { AddMemberDialog, USER_SEARCH_DEBOUNCE_MS } from './add-member-dialog';

const SEARCH =
  (term: string) => (req: { url: string; params: { get(k: string): string | null } }) =>
    req.url === '/api/v1/accounts/users/' && req.params.get('search') === term;

const jane: UserSummary = { id: 2, username: 'jane', full_name: 'Jane Roe' };
const sam: UserSummary = { id: 3, username: 'sam.lee', full_name: '' };
const added: ProjectMember = {
  id: 30,
  user_id: 2,
  username: 'jane',
  full_name: 'Jane Roe',
  email: 'jane@example.com',
  role: 'TEAM_MEMBER',
  created_at: '2026-10-02T10:00:00Z',
};

describe('AddMemberDialog', () => {
  let fixture: ComponentFixture<AddMemberDialog>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  const ref = { close: vi.fn() };

  beforeEach(async () => {
    vi.useFakeTimers();
    ref.close.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: { projectId: 7, existingUserIds: [1] } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AddMemberDialog);
    el = fixture.nativeElement;
    await settle(fixture);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  const search = async (term: string) => {
    const field = el.querySelector<HTMLInputElement>('input')!;
    field.value = term;
    field.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(USER_SEARCH_DEBOUNCE_MS);
    await settle(fixture);
  };
  const addButton = () =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('app-modal button')).find((b) =>
      b.textContent?.includes('Add member'),
    )!;
  const pick = async (name: string) => {
    Array.from(el.querySelectorAll<HTMLButtonElement>('.person'))
      .find((b) => b.textContent?.includes(name))!
      .click();
    await settle(fixture);
  };

  it('asks for at least two characters and makes no request before that', async () => {
    expect(el.textContent).toContain('Type at least 2 characters to search.');

    await search('j');

    httpMock.expectNone(() => true);
    expect(el.textContent).toContain('Type at least 2 characters to search.');
  });

  it('waits for the user to stop typing before searching', async () => {
    const field = el.querySelector<HTMLInputElement>('input')!;
    for (const term of ['ja', 'jan', 'jane']) {
      field.value = term;
      field.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);
    }
    await settle(fixture);
    httpMock.expectNone(() => true);

    vi.advanceTimersByTime(USER_SEARCH_DEBOUNCE_MS);
    await settle(fixture);
    httpMock.expectOne(SEARCH('jane')).flush([jane]);
  });

  it('lists matches by full name, falling back to the username', async () => {
    await search('ja');
    httpMock.expectOne(SEARCH('ja')).flush([jane, sam]);
    await settle(fixture);

    const names = Array.from(el.querySelectorAll('.person strong')).map((node) => node.textContent);
    expect(names).toEqual(['Jane Roe', 'sam.lee']);
  });

  it('marks people who are already members and does not let them be picked', async () => {
    await search('jo');
    httpMock
      .expectOne(SEARCH('jo'))
      .flush([{ id: 1, username: 'john.doe', full_name: 'John Doe' }, jane]);
    await settle(fixture);

    const john = Array.from(el.querySelectorAll<HTMLButtonElement>('.person')).find((p) =>
      p.textContent?.includes('John Doe'),
    )!;
    expect(john.disabled).toBe(true);
    expect(john.textContent).toContain('Already a member');
  });

  it('says when nobody matches or the search fails', async () => {
    await search('zz');
    httpMock.expectOne(SEARCH('zz')).flush([]);
    await settle(fixture);
    expect(el.textContent).toContain('No people found.');

    await search('yy');
    httpMock
      .expectOne(SEARCH('yy'))
      .flush(
        { detail: 'Search is down.', code: 'server_error' },
        { status: 500, statusText: 'Server Error' },
      );
    await settle(fixture);
    expect(el.textContent).toContain('Search is down.');
  });

  it('keeps Add member disabled until someone is chosen', async () => {
    expect(addButton().disabled).toBe(true);

    await search('ja');
    httpMock.expectOne(SEARCH('ja')).flush([jane]);
    await settle(fixture);
    await pick('Jane Roe');

    expect(addButton().disabled).toBe(false);
    expect(el.textContent).toContain('Jane Roe');
    expect(el.querySelector('select')).not.toBeNull();
  });

  it('adds the chosen person as a team member by default and closes with the new member', async () => {
    await search('ja');
    httpMock.expectOne(SEARCH('ja')).flush([jane]);
    await settle(fixture);
    await pick('Jane Roe');

    addButton().click();
    const req = httpMock.expectOne('/api/v1/projects/7/members/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user_id: 2, role: 'TEAM_MEMBER' });
    req.flush(added);
    await settle(fixture);

    expect(ref.close).toHaveBeenCalledWith(added);
  });

  it('sends the selected role', async () => {
    await search('ja');
    httpMock.expectOne(SEARCH('ja')).flush([jane]);
    await settle(fixture);
    await pick('Jane Roe');

    const select = el.querySelector('select')!;
    select.value = 'VIEWER';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await settle(fixture);
    addButton().click();

    const req = httpMock.expectOne('/api/v1/projects/7/members/');
    expect(req.request.body).toEqual({ user_id: 2, role: 'VIEWER' });
    req.flush(added);
  });

  it('shows a server refusal in an alert and stays open', async () => {
    await search('ja');
    httpMock.expectOne(SEARCH('ja')).flush([jane]);
    await settle(fixture);
    await pick('Jane Roe');

    addButton().click();
    httpMock
      .expectOne('/api/v1/projects/7/members/')
      .flush(
        { detail: 'User is already a member of this project.', code: 'bad_request' },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle(fixture);

    expect(el.querySelector('[role="alert"]')!.textContent).toContain(
      'User is already a member of this project.',
    );
    expect(ref.close).not.toHaveBeenCalled();
  });

  it('lets the user change their pick', async () => {
    await search('ja');
    httpMock.expectOne(SEARCH('ja')).flush([jane]);
    await settle(fixture);
    await pick('Jane Roe');

    Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => b.textContent?.trim() === 'Change')!
      .click();
    await settle(fixture);

    expect(el.querySelector('input')).not.toBeNull();
    expect(addButton().disabled).toBe(true);
  });
});

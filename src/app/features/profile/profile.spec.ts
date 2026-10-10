import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { User } from '../../core/api/models';
import { SessionStore } from '../../core/auth';
import { errorInterceptor } from '../../core/http/error.interceptor';
import { Profile } from './profile';

const user: User = {
  id: 1,
  username: 'john.doe',
  email: 'john.doe@example.com',
  full_name: 'John Doe',
  role: 'PROJECT_MANAGER',
};

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  let httpMock: HttpTestingController;
  let session: SessionStore;
  let el: HTMLElement;

  const inputs = () => Array.from(el.querySelectorAll<HTMLInputElement>('input'));
  const saveButton = () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const type = async (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    session = TestBed.inject(SessionStore);
    session.setUser(user);
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Profile);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('is pre-filled from the session, with a read-only username and the role', () => {
    const [fullName, email, username] = inputs();
    expect(fullName.value).toBe('John Doe');
    expect(email.value).toBe('john.doe@example.com');
    expect(username.value).toBe('john.doe');
    expect(username.disabled).toBe(true);
    expect(el.textContent).toContain('Project Manager');
  });

  it('keeps Save disabled until something changes', async () => {
    expect(saveButton().disabled).toBe(true);

    await type(inputs()[0], 'Johnny Doe');
    expect(saveButton().disabled).toBe(false);
  });

  it('saves trimmed values, updates the session and confirms', async () => {
    await type(inputs()[0], '  Johnny Doe  ');
    await submit();

    const req = httpMock.expectOne('/api/v1/accounts/profile/');
    expect(req.request.body).toEqual({
      full_name: 'Johnny Doe',
      email: 'john.doe@example.com',
    });
    req.flush({ ...user, full_name: 'Johnny Doe' });
    await fixture.whenStable();

    expect(session.user()?.full_name).toBe('Johnny Doe');
    expect(session.displayName()).toBe('Johnny Doe');
    expect(el.textContent).toContain('Your profile has been updated.');
    expect(inputs()[0].value).toBe('Johnny Doe');
    expect(saveButton().disabled).toBe(true);
    // Regression: resetting the form must not blank the read-only username.
    expect(inputs()[2].value).toBe('john.doe');
  });

  it('hides the confirmation once the user edits again', async () => {
    await type(inputs()[0], 'Johnny');
    await submit();
    httpMock.expectOne('/api/v1/accounts/profile/').flush({ ...user, full_name: 'Johnny' });
    await fixture.whenStable();
    expect(el.textContent).toContain('Your profile has been updated.');

    await type(inputs()[0], 'Johnny D');
    expect(el.textContent).not.toContain('Your profile has been updated.');
  });

  it('does not call the API for a blank name and shows the error', async () => {
    await type(inputs()[0], '   ');
    await submit();

    httpMock.expectNone('/api/v1/accounts/profile/');
    expect(el.textContent).toContain('Full name is required.');
  });

  it('shows a server error next to the email field', async () => {
    await type(inputs()[1], 'taken@example.com');
    await submit();

    httpMock.expectOne('/api/v1/accounts/profile/').flush(
      {
        detail: 'Validation failed.',
        code: 'validation_error',
        errors: { email: ['An account with this email already exists.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'An account with this email already exists.',
    );
    expect(session.user()?.email).toBe('john.doe@example.com');
  });

  it('shows a general error in an alert', async () => {
    await type(inputs()[0], 'Johnny');
    await submit();

    httpMock.expectOne('/api/v1/accounts/profile/').error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(el.textContent).toContain('Unable to reach the server');
  });
});

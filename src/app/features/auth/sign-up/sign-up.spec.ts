import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SessionStore } from '../../../core/auth';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { SignUp } from './sign-up';

const REGISTER_URL = '/api/v1/accounts/register/';

describe('SignUp', () => {
  let fixture: ComponentFixture<SignUp>;
  let httpMock: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let root: HTMLElement;

  const field = (label: string) =>
    Array.from(root.querySelectorAll('app-text-field')).find(
      (el) => el.querySelector('label')?.textContent?.trim() === label,
    )!;

  const type = (label: string, value: string) => {
    const input = field(label).querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };

  const fillValid = () => {
    type('Full name', '  Jane Doe ');
    type('Email address', ' jane.doe@example.com ');
    type('Password', 'secret123');
    type('Confirm password', 'secret123');
  };

  const submit = () => {
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SignUp);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('asks for full name, email and password, but not a username', () => {
    expect(field('Full name')).toBeTruthy();
    expect(field('Email address')).toBeTruthy();
    expect(field('Password')).toBeTruthy();
    expect(root.textContent).not.toContain('Username');
    expect(root.querySelector('a[href="/sign-in"]')).not.toBeNull();
  });

  it('shows required errors and sends nothing when the form is empty', () => {
    submit();

    expect(root.textContent).toContain('Full name is required.');
    expect(root.textContent).toContain('Email address is required.');
    expect(root.textContent).toContain('Password is required.');
    httpMock.expectNone(REGISTER_URL);
  });

  it('validates the email format and password length', () => {
    type('Full name', 'Jane');
    type('Email address', 'not-an-email');
    type('Password', 'short');
    type('Confirm password', 'short');
    submit();

    expect(root.textContent).toContain('Enter a valid email address.');
    expect(root.textContent).toContain('Password must be at least 8 characters.');
    httpMock.expectNone(REGISTER_URL);
  });

  it('flags mismatching passwords', () => {
    fillValid();
    type('Confirm password', 'different1');
    submit();

    expect(root.textContent).toContain('Passwords do not match.');
    httpMock.expectNone(REGISTER_URL);
  });

  it('registers with trimmed values and sends the user to sign-in', () => {
    fillValid();
    submit();

    const req = httpMock.expectOne(REGISTER_URL);
    expect(req.request.body).toEqual({
      full_name: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'secret123',
      password_confirm: 'secret123',
    });
    req.flush({
      message: 'User registered successfully.',
      user: {
        id: 9,
        username: 'jane.doe',
        email: 'jane.doe@example.com',
        full_name: 'Jane Doe',
        role: 'TEAM_MEMBER',
      },
    });

    expect(navigate).toHaveBeenCalledWith(['/sign-in'], { queryParams: { registered: '1' } });
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
  });

  it('shows a taken email next to the email field', () => {
    fillValid();
    submit();

    httpMock.expectOne(REGISTER_URL).flush(
      {
        detail: 'Validation failed.',
        code: 'validation_error',
        errors: { email: ['An account with this email already exists.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(field('Email address').textContent).toContain(
      'An account with this email already exists.',
    );
    expect(root.querySelector('app-alert')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows errors that belong to no field in the alert', () => {
    fillValid();
    submit();

    httpMock
      .expectOne(REGISTER_URL)
      .flush(
        { detail: 'Something broke.', code: 'server_error' },
        { status: 500, statusText: 'x' },
      );
    fixture.detectChanges();

    expect(root.querySelector('app-alert')?.textContent).toContain('Something');
  });

  it('does not send a second request while one is in flight', () => {
    fillValid();
    submit();
    submit();

    expect(httpMock.match(REGISTER_URL)).toHaveLength(1);
  });
});

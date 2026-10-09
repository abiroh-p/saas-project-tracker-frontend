import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SessionStore, TokenStorageService } from '../../../core/auth';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { SignIn } from './sign-in';

const LOGIN_URL = '/api/v1/accounts/login/';
const user = {
  id: 3,
  username: 'jane',
  email: 'jane@example.com',
  full_name: 'Jane Doe',
  role: 'TEAM_MEMBER',
};

describe('SignIn', () => {
  let fixture: ComponentFixture<SignIn>;
  let httpMock: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let root: HTMLElement;

  const type = (label: string, value: string) => {
    const input = Array.from(root.querySelectorAll('app-text-field'))
      .find((field) => field.querySelector('label')?.textContent?.includes(label))!
      .querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };

  const submit = () => {
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SignIn);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('asks for an email or username and a password', () => {
    expect(root.textContent).toContain('Email or username');
    expect(root.textContent).toContain('Password');
    expect(root.querySelector('a[href="/sign-up"]')).not.toBeNull();
  });

  it('shows required errors and sends nothing when the form is empty', () => {
    submit();

    expect(root.textContent).toContain('Email or username is required.');
    expect(root.textContent).toContain('Password is required.');
    httpMock.expectNone(LOGIN_URL);
  });

  it('treats a whitespace-only identifier as empty', () => {
    type('Email or username', '   ');
    type('Password', 'secret123');
    submit();

    expect(root.textContent).toContain('Email or username is required.');
    httpMock.expectNone(LOGIN_URL);
  });

  it('signs in with an email, stores the session and goes to the dashboard', () => {
    type('Email or username', '  jane@example.com ');
    type('Password', 'secret123');
    submit();

    const req = httpMock.expectOne(LOGIN_URL);
    expect(req.request.body).toEqual({ identifier: 'jane@example.com', password: 'secret123' });
    req.flush({ access: 'a', refresh: 'r', user });

    expect(TestBed.inject(SessionStore).user()).toEqual(user);
    expect(localStorage.getItem('pt.refresh')).toBe('r');
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('keeps the session in sessionStorage when "Remember me" is cleared', () => {
    root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    type('Email or username', 'jane');
    type('Password', 'secret123');
    submit();

    httpMock.expectOne(LOGIN_URL).flush({ access: 'a', refresh: 'r', user });

    expect(sessionStorage.getItem('pt.refresh')).toBe('r');
    expect(localStorage.getItem('pt.refresh')).toBeNull();
    expect(TestBed.inject(TokenStorageService).hasSession()).toBe(true);
  });

  it('returns to the page the user came from', () => {
    fixture.componentRef.setInput('returnUrl', '/projects/4');
    type('Email or username', 'jane');
    type('Password', 'secret123');
    submit();

    httpMock.expectOne(LOGIN_URL).flush({ access: 'a', refresh: 'r', user });

    expect(navigateByUrl).toHaveBeenCalledWith('/projects/4');
  });

  it('ignores an unsafe returnUrl', () => {
    fixture.componentRef.setInput('returnUrl', '//evil.example.com');
    type('Email or username', 'jane');
    type('Password', 'secret123');
    submit();

    httpMock.expectOne(LOGIN_URL).flush({ access: 'a', refresh: 'r', user });

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the backend message for wrong credentials and stays on the page', () => {
    type('Email or username', 'jane');
    type('Password', 'wrong-password');
    submit();

    httpMock.expectOne(LOGIN_URL).flush(
      {
        detail: 'Validation failed.',
        code: 'validation_error',
        errors: { non_field_errors: ['Invalid email/username or password.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(root.querySelector('app-alert')?.textContent).toContain(
      'Invalid email/username or password.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(root.querySelector('button[type="submit"]')?.hasAttribute('aria-busy')).toBe(false);
  });

  it('shows a network failure in the alert', () => {
    type('Email or username', 'jane');
    type('Password', 'secret123');
    submit();

    httpMock.expectOne(LOGIN_URL).error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(root.querySelector('app-alert')?.textContent).toContain('Unable to reach the server');
  });

  it('does not send a second request while one is in flight', () => {
    type('Email or username', 'jane');
    type('Password', 'secret123');
    submit();
    submit();

    expect(httpMock.match(LOGIN_URL)).toHaveLength(1);
  });

  it('confirms a freshly created account', () => {
    fixture.componentRef.setInput('registered', '1');
    fixture.detectChanges();

    expect(root.querySelector('app-alert')?.textContent).toContain(
      'Your account has been created. Please sign in.',
    );
  });

  it('explains an expired session', () => {
    fixture.componentRef.setInput('reason', 'expired');
    fixture.detectChanges();

    expect(root.querySelector('app-alert')?.textContent).toContain('Your session expired');
  });
});

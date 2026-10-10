import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../core/http/error.interceptor';
import { Account } from './account';

describe('Account (change password)', () => {
  let fixture: ComponentFixture<Account>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  const inputs = () => Array.from(el.querySelectorAll<HTMLInputElement>('input'));
  const type = async (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const fill = async (current: string, next: string, confirm: string) => {
    const [a, b, c] = inputs();
    await type(a, current);
    await type(b, next);
    await type(c, confirm);
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const alerts = () =>
    Array.from(el.querySelectorAll('[role="alert"]')).map((node) => node.textContent?.trim());

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Account);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => httpMock.verify());

  it('requires all fields before calling the API', async () => {
    await submit();

    httpMock.expectNone('/api/v1/accounts/change-password/');
    expect(alerts()).toEqual([
      'Current password is required.',
      'New password is required.',
      'Confirm new password is required.',
    ]);
  });

  it('enforces the minimum length', async () => {
    await fill('old-password', 'short', 'short');
    await submit();

    httpMock.expectNone('/api/v1/accounts/change-password/');
    expect(alerts()).toContain('New password must be at least 8 characters.');
  });

  it('flags a confirmation that does not match', async () => {
    await fill('old-password', 'brand-new-pass', 'brand-new-pasx');
    await submit();

    httpMock.expectNone('/api/v1/accounts/change-password/');
    expect(alerts()).toContain('Passwords do not match.');
  });

  it('submits the three fields, clears the form and confirms', async () => {
    await fill('old-password', 'brand-new-pass', 'brand-new-pass');
    await submit();

    const req = httpMock.expectOne('/api/v1/accounts/change-password/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      current_password: 'old-password',
      new_password: 'brand-new-pass',
      new_password_confirm: 'brand-new-pass',
    });
    req.flush({ message: 'Password changed successfully.' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Your password has been updated.');
    expect(inputs().map((input) => input.value)).toEqual(['', '', '']);
    expect(alerts().filter((text) => text?.includes('required'))).toEqual([]);
  });

  it('shows a wrong current password next to that field', async () => {
    await fill('wrong-password', 'brand-new-pass', 'brand-new-pass');
    await submit();

    httpMock.expectOne('/api/v1/accounts/change-password/').flush(
      {
        detail: 'Validation failed.',
        code: 'validation_error',
        errors: { current_password: ['Current password is incorrect.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(alerts()).toEqual(['Current password is incorrect.']);
    expect(el.textContent).not.toContain('Your password has been updated.');
  });

  it('ignores a second submit while the request is in flight', async () => {
    await fill('old-password', 'brand-new-pass', 'brand-new-pass');
    await submit();
    await submit();

    expect(httpMock.match('/api/v1/accounts/change-password/')).toHaveLength(1);
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { User } from '../api/models';
import { AuthService } from './auth.service';
import { SessionStore } from './session.store';
import { TokenStorageService } from './token-storage.service';

const API = '/api/v1/accounts';
const user: User = {
  id: 7,
  username: 'sam',
  email: 'sam@example.com',
  full_name: 'Sam Doe',
  role: 'PROJECT_MANAGER',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokens: TokenStorageService;
  let session: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorageService);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => httpMock.verify());

  it('login stores tokens (remembered) and the user', async () => {
    const result = firstValueFrom(
      service.login({ identifier: 'sam@example.com', password: 'pw' }, true),
    );

    const req = httpMock.expectOne(`${API}/login/`);
    expect(req.request.body).toEqual({ identifier: 'sam@example.com', password: 'pw' });
    req.flush({ access: 'a', refresh: 'r', user });

    expect(await result).toEqual(user);
    expect(session.user()).toEqual(user);
    expect(localStorage.getItem('pt.refresh')).toBe('r');
  });

  it('login without remember keeps the session in sessionStorage', async () => {
    const result = firstValueFrom(service.login({ identifier: 'sam', password: 'pw' }, false));
    httpMock.expectOne(`${API}/login/`).flush({ access: 'a', refresh: 'r', user });
    await result;

    expect(sessionStorage.getItem('pt.refresh')).toBe('r');
    expect(localStorage.getItem('pt.refresh')).toBeNull();
  });

  it('register returns the created user and does not sign in', async () => {
    const result = firstValueFrom(
      service.register({
        full_name: 'Sam Doe',
        email: 'sam@example.com',
        password: 'secret123',
        password_confirm: 'secret123',
      }),
    );
    const req = httpMock.expectOne(`${API}/register/`);
    expect(req.request.body).toEqual({
      full_name: 'Sam Doe',
      email: 'sam@example.com',
      password: 'secret123',
      password_confirm: 'secret123',
    });
    req.flush({ message: 'ok', user });

    expect(await result).toEqual(user);
    expect(session.isAuthenticated()).toBe(false);
    expect(tokens.hasSession()).toBe(false);
  });

  it('logout posts the refresh token and clears the session', async () => {
    tokens.save({ access: 'a', refresh: 'r' }, true);
    session.setUser(user);

    const result = firstValueFrom(service.logout());
    const req = httpMock.expectOne(`${API}/logout/`);
    expect(req.request.body).toEqual({ refresh: 'r' });
    req.flush({ message: 'Logout successful.' });
    await result;

    expect(tokens.hasSession()).toBe(false);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('logout still clears the session when the server call fails', async () => {
    tokens.save({ access: 'a', refresh: 'r' }, true);
    session.setUser(user);

    const result = firstValueFrom(service.logout());
    httpMock.expectOne(`${API}/logout/`).flush({}, { status: 500, statusText: 'Server Error' });
    await result;

    expect(tokens.hasSession()).toBe(false);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('logout without a stored session makes no request', async () => {
    await firstValueFrom(service.logout());
    httpMock.expectNone(`${API}/logout/`);
  });

  it('restoreSession loads the user when tokens exist', async () => {
    tokens.save({ access: 'a', refresh: 'r' }, true);

    const restored = service.restoreSession();
    httpMock.expectOne(`${API}/me/`).flush(user);
    await restored;

    expect(session.user()).toEqual(user);
  });

  it('restoreSession clears a stale session', async () => {
    tokens.save({ access: 'a', refresh: 'r' }, true);

    const restored = service.restoreSession();
    httpMock.expectOne(`${API}/me/`).flush({}, { status: 401, statusText: 'Unauthorized' });
    await restored;

    expect(session.isAuthenticated()).toBe(false);
    expect(tokens.hasSession()).toBe(false);
  });

  it('restoreSession does nothing without tokens', async () => {
    await service.restoreSession();
    httpMock.expectNone(`${API}/me/`);
  });
});

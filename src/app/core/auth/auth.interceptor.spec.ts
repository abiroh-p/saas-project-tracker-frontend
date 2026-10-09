import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { ApiError, User } from '../api/models';
import { errorInterceptor } from '../http/error.interceptor';
import { authInterceptor } from './auth.interceptor';
import { SessionStore } from './session.store';
import { TokenStorageService } from './token-storage.service';

const API = '/api/v1';
const user: User = {
  id: 1,
  username: 'sam',
  email: 'sam@example.com',
  full_name: 'Sam Doe',
  role: 'TEAM_MEMBER',
};
const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokens: TokenStorageService;
  let session: SessionStore;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorageService);
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('attaches the access token to API requests', () => {
    tokens.save({ access: 'access-1', refresh: 'refresh-1' }, true);

    http.get(`${API}/projects/`).subscribe();

    const req = httpMock.expectOne(`${API}/projects/`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush([]);
  });

  it('does not attach the token to requests outside the API', () => {
    tokens.save({ access: 'access-1', refresh: 'refresh-1' }, true);

    http.get('https://example.com/data').subscribe();

    const req = httpMock.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not attach the token to public auth endpoints', () => {
    tokens.save({ access: 'access-1', refresh: 'refresh-1' }, true);

    http.post(`${API}/accounts/login/`, {}).subscribe();

    const req = httpMock.expectOne(`${API}/accounts/login/`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('refreshes the token on a 401 and retries the request', async () => {
    tokens.save({ access: 'old', refresh: 'refresh-1' }, true);

    const result = firstValueFrom(http.get<{ ok: boolean }>(`${API}/projects/`));

    httpMock.expectOne(`${API}/projects/`).flush({ detail: 'expired' }, unauthorized);

    const refresh = httpMock.expectOne(`${API}/accounts/token/refresh/`);
    expect(refresh.request.body).toEqual({ refresh: 'refresh-1' });
    refresh.flush({ access: 'new' });

    const retry = httpMock.expectOne(`${API}/projects/`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({ ok: true });

    expect(await result).toEqual({ ok: true });
    expect(tokens.accessToken).toBe('new');
  });

  it('shares one refresh request between concurrent 401s', async () => {
    tokens.save({ access: 'old', refresh: 'refresh-1' }, true);

    const first = firstValueFrom(http.get(`${API}/projects/`));
    const second = firstValueFrom(http.get(`${API}/issues/1/`));

    httpMock.expectOne(`${API}/projects/`).flush({}, unauthorized);
    httpMock.expectOne(`${API}/issues/1/`).flush({}, unauthorized);

    httpMock.expectOne(`${API}/accounts/token/refresh/`).flush({ access: 'new' });

    httpMock.expectOne(`${API}/projects/`).flush({ a: 1 });
    httpMock.expectOne(`${API}/issues/1/`).flush({ b: 2 });

    expect(await first).toEqual({ a: 1 });
    expect(await second).toEqual({ b: 2 });
  });

  it('signs the user out and redirects when the refresh fails', async () => {
    tokens.save({ access: 'old', refresh: 'bad' }, true);
    session.setUser(user);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const result = firstValueFrom(http.get(`${API}/projects/`)).catch((error: ApiError) => error);

    httpMock.expectOne(`${API}/projects/`).flush({ detail: 'expired' }, unauthorized);
    httpMock.expectOne(`${API}/accounts/token/refresh/`).flush({ detail: 'invalid' }, unauthorized);

    const error = (await result) as ApiError;
    expect(error.status).toBe(401);
    expect(tokens.hasSession()).toBe(false);
    expect(session.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/sign-in'],
      expect.objectContaining({ queryParams: expect.objectContaining({ reason: 'expired' }) }),
    );
  });

  it('does not try to refresh when there is no refresh token', async () => {
    const result = firstValueFrom(http.get(`${API}/projects/`)).catch((error: ApiError) => error);

    httpMock
      .expectOne(`${API}/projects/`)
      .flush({ detail: 'Authentication required.' }, unauthorized);

    expect(((await result) as ApiError).status).toBe(401);
    httpMock.expectNone(`${API}/accounts/token/refresh/`);
  });

  it('normalises validation errors into ApiError', async () => {
    tokens.save({ access: 'a', refresh: 'r' }, true);

    const result = firstValueFrom(http.post(`${API}/projects/`, {})).catch(
      (error: ApiError) => error,
    );

    httpMock
      .expectOne(`${API}/projects/`)
      .flush(
        { detail: 'Validation failed.', code: 'validation_error', errors: { key: ['Required.'] } },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(await result).toEqual({
      status: 400,
      code: 'validation_error',
      detail: 'Validation failed.',
      errors: { key: ['Required.'] },
    });
  });
});

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { SessionStore } from './session.store';

const route = {} as ActivatedRouteSnapshot;
const stateAt = (url: string) => ({ url }) as RouterStateSnapshot;

describe('route guards', () => {
  let session: SessionStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  const run = (guard: typeof authGuard, url = '/') =>
    TestBed.runInInjectionContext(() => guard(route, stateAt(url)));

  it('authGuard lets signed-in users through', () => {
    session.setUser({
      id: 1,
      username: 's',
      email: 's@x.com',
      full_name: 'S',
      role: 'TEAM_MEMBER',
    });
    expect(run(authGuard, '/projects')).toBe(true);
  });

  it('authGuard redirects guests to sign-in and remembers the target', () => {
    const result = run(authGuard, '/projects/5') as UrlTree;
    expect(router.serializeUrl(result)).toBe('/sign-in?returnUrl=%2Fprojects%2F5');
  });

  it('authGuard does not add a returnUrl for the root path', () => {
    const result = run(authGuard, '/') as UrlTree;
    expect(router.serializeUrl(result)).toBe('/sign-in');
  });

  it('guestGuard allows guests', () => {
    expect(run(guestGuard)).toBe(true);
  });

  it('guestGuard sends signed-in users to the dashboard', () => {
    session.setUser({
      id: 1,
      username: 's',
      email: 's@x.com',
      full_name: 'S',
      role: 'TEAM_MEMBER',
    });
    const result = run(guestGuard) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/dashboard');
  });
});

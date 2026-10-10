import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionStore, TokenStorageService } from '../../core/auth';
import { AppShell } from './app-shell';

@Component({ template: '<h1>Page</h1>' })
class DummyPage {}

describe('AppShell', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: '',
            component: AppShell,
            children: [
              { path: 'dashboard', component: DummyPage },
              { path: 'projects', component: DummyPage },
              { path: 'settings/profile', component: DummyPage },
            ],
          },
          { path: 'sign-in', component: DummyPage },
        ]),
      ],
    });

    TestBed.inject(SessionStore).setUser({
      id: 1,
      username: 'john.doe',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      role: 'TEAM_MEMBER',
    });

    harness = await RouterTestingHarness.create('/dashboard');
    el = harness.fixture.nativeElement;
    await harness.fixture.whenStable();
  });

  const links = () => Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav-link'));
  const shell = () => el.querySelector('.shell')!;
  const menuButton = () => el.querySelector<HTMLButtonElement>('.topbar__menu')!;

  it('lists the primary and settings navigation', () => {
    expect(links().map((link) => link.textContent?.trim())).toEqual([
      'Dashboard',
      'Projects',
      'Issues',
      'Profile',
      'Account',
    ]);
    expect(links().map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard',
      '/projects',
      '/issues',
      '/settings/profile',
      '/settings/account',
    ]);
  });

  it('marks the current page as active', async () => {
    expect(links()[0].classList).toContain('is-active');
    expect(links()[0].getAttribute('aria-current')).toBe('page');
    expect(links()[1].classList).not.toContain('is-active');

    await harness.navigateByUrl('/projects');
    await harness.fixture.whenStable();

    expect(links()[0].classList).not.toContain('is-active');
    expect(links()[1].classList).toContain('is-active');
  });

  it('renders the routed page and the signed-in user', () => {
    expect(el.querySelector('main h1')?.textContent).toBe('Page');
    expect(el.querySelector('.user-button')?.textContent).toContain('John Doe');
  });

  it('opens and closes the drawer from the menu button', async () => {
    expect(shell().classList).not.toContain('shell--nav-open');
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');

    menuButton().click();
    await harness.fixture.whenStable();
    expect(shell().classList).toContain('shell--nav-open');
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');

    el.querySelector<HTMLElement>('.shell__backdrop')!.click();
    await harness.fixture.whenStable();
    expect(shell().classList).not.toContain('shell--nav-open');
  });

  it('closes the drawer on Escape and after navigating', async () => {
    menuButton().click();
    await harness.fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await harness.fixture.whenStable();
    expect(shell().classList).not.toContain('shell--nav-open');

    menuButton().click();
    await harness.fixture.whenStable();
    await harness.navigateByUrl('/projects');
    await harness.fixture.whenStable();
    expect(shell().classList).not.toContain('shell--nav-open');
  });

  it('skip link moves focus to the main content', async () => {
    el.querySelector<HTMLAnchorElement>('.skip-link')!.click();
    expect(document.activeElement).toBe(el.querySelector('main'));
  });

  it('signs out from the account menu and returns to sign-in', async () => {
    TestBed.inject(TokenStorageService).save({ access: 'a', refresh: 'r' }, true);
    const httpMock = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);

    el.querySelector<HTMLButtonElement>('.user-button')!.click();
    await harness.fixture.whenStable();

    const items = Array.from(document.querySelectorAll<HTMLElement>('[cdkMenuItem]'));
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      'Profile settings',
      'Change password',
      'Sign out',
    ]);

    items[2].click();
    httpMock.expectOne('/api/v1/accounts/logout/').flush({ message: 'Logout successful.' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
    expect(router.url).toBe('/sign-in');
    httpMock.verify();
  });
});

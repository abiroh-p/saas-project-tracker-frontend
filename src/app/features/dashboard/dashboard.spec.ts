import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Dashboard } from '../../core/api/models';
import { errorInterceptor } from '../../core/http/error.interceptor';
import { settle } from '../../testing/settle';
import { DashboardPage } from './dashboard';

const dashboard: Dashboard = {
  summary: {
    projects_count: 2,
    assigned_issues_count: 4,
    in_progress_count: 1,
    completed_count: 2,
    overdue_count: 1,
  },
  issues_by_status: {
    TODO: 1,
    IN_PROGRESS: 1,
    IN_REVIEW: 0,
    DONE: 2,
  },
  recent_issues: [
    {
      id: 7,
      issue_key: 'ALPHA-7',
      title: 'Connect the dashboard',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      project_id: 3,
      due_date: null,
      updated_at: '2026-10-12T09:00:00Z',
    },
  ],
};

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardPage);
    el = fixture.nativeElement;
    await settle(fixture);
  }

  afterEach(() => httpMock.verify());

  it('loads and renders the dashboard summary', async () => {
    await setup();

    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();
    httpMock.expectOne('/api/v1/dashboard/').flush(dashboard);
    await settle(fixture);

    expect(el.querySelector('[aria-busy="true"]')).toBeNull();
    expect(el.textContent).toContain('Projects');
    expect(el.textContent).toContain('2');
    expect(el.textContent).toContain('Assigned issues');
    expect(el.textContent).toContain('4');
    expect(el.textContent).toContain('Issues by status');
    expect(el.textContent).toContain('ALPHA-7');
    expect(el.querySelector('.recent a')!.getAttribute('href')).toBe('/issues/7');
  });

  it('shows an error and retries the dashboard request', async () => {
    await setup();

    httpMock
      .expectOne('/api/v1/dashboard/')
      .flush(
        { detail: 'Dashboard unavailable.', code: 'server_error' },
        { status: 500, statusText: 'Server Error' },
      );
    await settle(fixture);

    expect(el.textContent).toContain('Dashboard could not be loaded');
    expect(el.textContent).toContain('Dashboard unavailable.');

    Array.from(el.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Try again'))!
      .click();
    await settle(fixture);

    httpMock.expectOne('/api/v1/dashboard/').flush(dashboard);
    await settle(fixture);
    expect(el.textContent).toContain('Connect the dashboard');
  });
});

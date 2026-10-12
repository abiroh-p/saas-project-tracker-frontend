import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Page, Project } from '../../core/api/models';
import { errorInterceptor } from '../../core/http/error.interceptor';
import { settle } from '../../testing/settle';
import { IssueList } from './issue-list';

const project: Project = {
  id: 7,
  key: 'WR',
  name: 'Website Redesign',
  description: '',
  start_date: null,
  end_date: null,
  created_by: 'john.doe',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  is_archived: false,
  my_role: 'PROJECT_MANAGER',
};

const page = <T>(results: T[]): Page<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

describe('IssueList', () => {
  let fixture: ComponentFixture<IssueList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(IssueList);
    await settle(fixture);
  });

  afterEach(() => httpMock.verify());

  it('loads projects for the create-issue dropdown', async () => {
    httpMock
      .expectOne((request) => request.url === '/api/v1/projects/')
      .flush(page([project]));
    httpMock
      .expectOne((request) => request.url === '/api/v1/issues/')
      .flush(page([]));
    await settle(fixture);

    fixture.nativeElement.querySelector('app-page-header button').click();
    await settle(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const options = Array.from(root.querySelectorAll('.create-form option')).map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['Choose a project', 'WR · Website Redesign']);
  });
});

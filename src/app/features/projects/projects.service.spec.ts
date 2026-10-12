import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { Project } from '../../core/api/models';
import { ProjectsService } from './projects.service';

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

describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists projects with page and page_size', async () => {
    const result = firstValueFrom(service.list(2, 12));

    const req = httpMock.expectOne((r) => r.url === '/api/v1/projects/');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('12');
    req.flush({ count: 13, next: null, previous: '/x', results: [project] });

    expect((await result).results).toEqual([project]);
  });

  it('gets one project', async () => {
    const result = firstValueFrom(service.get(7));
    httpMock.expectOne('/api/v1/projects/7/').flush(project);
    expect(await result).toEqual(project);
  });

  it('creates a project including its key', async () => {
    const body = {
      key: 'WR',
      name: 'Website Redesign',
      description: '',
      start_date: null,
      end_date: null,
    };
    const result = firstValueFrom(service.create(body));

    const req = httpMock.expectOne('/api/v1/projects/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(project);
    expect(await result).toEqual(project);
  });

  it('updates a project with PATCH', async () => {
    const result = firstValueFrom(service.update(7, { name: 'Renamed' }));

    const req = httpMock.expectOne('/api/v1/projects/7/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Renamed' });
    req.flush({ ...project, name: 'Renamed' });
    expect((await result).name).toBe('Renamed');
  });

  it('archives a project', async () => {
    const result = firstValueFrom(service.archive(7));

    const req = httpMock.expectOne('/api/v1/projects/7/archive/');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Project archived successfully.' });
    expect(await result).toBeUndefined();
  });
});

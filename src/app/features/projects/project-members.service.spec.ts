import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ProjectMembersService } from './project-members.service';

const URL = '/api/v1/projects/7/members/';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectMembersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists members', async () => {
    const result = firstValueFrom(service.list(7));
    const req = httpMock.expectOne(URL);
    expect(req.request.method).toBe('GET');
    req.flush([]);
    expect(await result).toEqual([]);
  });

  it('adds a member by user id and role', async () => {
    const result = firstValueFrom(service.add(7, { user_id: 3, role: 'VIEWER' }));
    const req = httpMock.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user_id: 3, role: 'VIEWER' });
    req.flush({ id: 20 });
    expect(await result).toEqual({ id: 20 });
  });

  it('changes a role on the membership URL, not the user id', async () => {
    const result = firstValueFrom(service.changeRole(7, 12, 'PROJECT_MANAGER'));
    const req = httpMock.expectOne(`${URL}12/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'PROJECT_MANAGER' });
    req.flush({ id: 12 });
    await result;
  });

  it('removes a member', async () => {
    const result = firstValueFrom(service.remove(7, 12), { defaultValue: undefined });
    const req = httpMock.expectOne(`${URL}12/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await result;
  });
});

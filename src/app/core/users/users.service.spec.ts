import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('searches users by term', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(UsersService);
    const httpMock = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(service.search('jane'));

    const req = httpMock.expectOne((r) => r.url === '/api/v1/accounts/users/');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('jane');
    req.flush([{ id: 2, username: 'jane', full_name: 'Jane Roe' }]);

    expect(await result).toEqual([{ id: 2, username: 'jane', full_name: 'Jane Roe' }]);
    httpMock.verify();
  });
});

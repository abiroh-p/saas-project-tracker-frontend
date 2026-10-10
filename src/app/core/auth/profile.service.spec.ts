import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { User } from '../api/models';
import { ProfileService } from './profile.service';
import { SessionStore } from './session.store';

const updated: User = {
  id: 1,
  username: 'john.doe',
  email: 'new@example.com',
  full_name: 'Johnny Doe',
  role: 'TEAM_MEMBER',
};

describe('ProfileService', () => {
  it('patches the profile and refreshes the session user', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(ProfileService);
    const httpMock = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(SessionStore);

    const result = firstValueFrom(
      service.update({ full_name: 'Johnny Doe', email: 'new@example.com' }),
    );

    const req = httpMock.expectOne('/api/v1/accounts/profile/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ full_name: 'Johnny Doe', email: 'new@example.com' });
    req.flush(updated);

    expect(await result).toEqual(updated);
    expect(session.user()).toEqual(updated);
    httpMock.verify();
  });
});

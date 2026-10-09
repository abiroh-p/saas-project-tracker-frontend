import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    service = TestBed.inject(TokenStorageService);
  });

  it('starts empty', () => {
    expect(service.accessToken).toBeNull();
    expect(service.refreshToken).toBeNull();
    expect(service.hasSession()).toBe(false);
  });

  it('persists to localStorage when remember is true', () => {
    service.save({ access: 'a', refresh: 'r' }, true);
    expect(localStorage.getItem('pt.access')).toBe('a');
    expect(sessionStorage.getItem('pt.access')).toBeNull();
    expect(service.accessToken).toBe('a');
    expect(service.refreshToken).toBe('r');
  });

  it('uses sessionStorage when remember is false', () => {
    service.save({ access: 'a', refresh: 'r' }, false);
    expect(sessionStorage.getItem('pt.refresh')).toBe('r');
    expect(localStorage.getItem('pt.refresh')).toBeNull();
  });

  it('moves a session between storages on a new login', () => {
    service.save({ access: 'a', refresh: 'r' }, true);
    service.save({ access: 'b', refresh: 's' }, false);
    expect(localStorage.getItem('pt.access')).toBeNull();
    expect(service.accessToken).toBe('b');
  });

  it('updates the access token in the storage that holds the session', () => {
    service.save({ access: 'a', refresh: 'r' }, true);
    service.update({ access: 'new' });
    expect(localStorage.getItem('pt.access')).toBe('new');
    expect(service.refreshToken).toBe('r');

    service.update({ access: 'newer', refresh: 'rotated' });
    expect(service.refreshToken).toBe('rotated');
  });

  it('clears both storages', () => {
    service.save({ access: 'a', refresh: 'r' }, true);
    service.clear();
    expect(service.hasSession()).toBe(false);
    expect(localStorage.getItem('pt.access')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('starts unauthenticated when there is no stored session', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logs in with non-empty credentials and persists the session', () => {
    const ok = service.login('john.davis', 'secret');
    expect(ok).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('parrot.session')).not.toBeNull();
  });

  it('rejects login with an empty identifier or password', () => {
    expect(service.login('', 'secret')).toBe(false);
    expect(service.login('john.davis', '')).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the session on logout', () => {
    service.login('john.davis', 'secret');
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('parrot.session')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import type { AuthResponseDto } from '@parrot-social/shared-dto';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const AUTH_URL = `${environment.apiUrl}/auth`;

function authResponse(overrides: Partial<AuthResponseDto> = {}): AuthResponseDto {
  return {
    accessToken: 'token-abc',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: 'u1',
      username: 'john.davis',
      email: 'john.davis@example.com',
      firstName: 'John',
      lastName: 'Davis',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    // No stored token -> restoreSession() short-circuits without calling /auth/me.
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts unauthenticated when there is no stored session', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logs in and persists the access token', async () => {
    const promise = service.login('john.davis', 'secret');
    httpMock.expectOne(`${AUTH_URL}/login`).flush(authResponse());

    expect(await promise).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('parrot.accessToken')).toBe('token-abc');
  });

  it('reports failed login without throwing', async () => {
    const promise = service.login('john.davis', 'wrong');
    httpMock
      .expectOne(`${AUTH_URL}/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await promise).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the session on logout', async () => {
    const promise = service.login('john.davis', 'secret');
    httpMock.expectOne(`${AUTH_URL}/login`).flush(authResponse());
    await promise;

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('parrot.accessToken')).toBeNull();
  });
});

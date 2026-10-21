import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthTokenStore } from '../services/auth-token.store';
import { environment } from '../../../environments/environment';

@Component({ template: '' })
class BlankComponent {}

// Regression test for NG0200: AuthService's constructor fires a /auth/me request as soon as a
// token is in storage, and that request goes through this same interceptor. Injecting AuthService
// eagerly at the top of the interceptor (instead of lazily via Injector) re-enters AuthService's
// own construction and throws NG0200 - this test would fail loudly if that regressed.
describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(async () => {
    localStorage.clear();
    AuthTokenStore.set('token-abc');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: BlankComponent }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);

    // Constructing AuthService fires its own /auth/me restore call; flush it up front so each
    // test's own expectOne() only has to deal with the request it's actually testing. A 401 here
    // clears the stored token via restoreSession()'s own handling (asynchronously, via a
    // microtask), so wait for that to settle before re-setting the token for the tests.
    const auth = TestBed.inject(AuthService);
    httpMock
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await auth.whenReady;
    AuthTokenStore.set('token-abc');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches the bearer token to outgoing requests', () => {
    http.get('/posts').subscribe();
    const req = httpMock.expectOne('/posts');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-abc');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  // Regression for media images never rendering: without withCredentials the browser drops
  // the Set-Cookie the media-ref flow relies on, even on requests that have no bearer token.
  it('sets withCredentials even without a stored token', () => {
    AuthTokenStore.clear();
    http.get('/posts').subscribe();
    const req = httpMock.expectOne('/posts');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('logs out and redirects to /login on a 401 from a protected endpoint', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    let caught: unknown;
    http.get('/posts').subscribe({ error: (err) => (caught = err) });
    httpMock.expectOne('/posts').flush(null, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    expect(caught).toBeDefined();
    expect(AuthTokenStore.get()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('does not trigger logout for a 401 from /auth/login', async () => {
    let caught: unknown;
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: (err) => (caught = err) });
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    expect(caught).toBeDefined();
    expect(AuthTokenStore.get()).toBe('token-abc');
  });
});

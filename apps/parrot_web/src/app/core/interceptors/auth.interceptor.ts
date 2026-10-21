import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthTokenStore } from '../services/auth-token.store';

// /auth/login and /auth/register are excluded: a 401 there is a normal failed-attempt response
// handled by the form itself, not a reason to log out. /auth/me is excluded too: AuthService's
// own restoreSession() already handles its 401.
const SKIP_401_HANDLING = ['/auth/login', '/auth/register', '/auth/me'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = AuthTokenStore.get();
  // Injector, not AuthService/Router directly - AuthService's constructor issues an HTTP request
  // during its own construction, and that request passes through this interceptor; injecting
  // AuthService here synchronously would re-enter its own construction (NG0200). Deferring the
  // lookup until the catchError callback runs avoids the cycle.
  const injector = inject(Injector);

  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      const shouldLogout =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !SKIP_401_HANDLING.some((path) => req.url.includes(path));
      if (shouldLogout) {
        injector.get(AuthService).logout();
        injector.get(Router).navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};

import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { CsrfTokenService } from './csrf-token.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const SESSION_ROTATING_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/logout-all',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/mfa/verify',
  '/auth/mfa/reset',
];

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
  const isBackendRequest =
    request.url === API_BASE_URL || request.url.startsWith(`${API_BASE_URL}/`);

  if (!isBackendRequest || SAFE_METHODS.has(request.method.toUpperCase())) {
    return next(request);
  }

  const csrf = inject(CsrfTokenService);
  const rotatesSession = SESSION_ROTATING_PATHS.some(
    (path) => request.url === `${API_BASE_URL}${path}`,
  );

  return csrf.get().pipe(
    switchMap(({ headerName, token }) =>
      next(
          request.clone({
            withCredentials: true,
            setHeaders: { [headerName]: token },
          }),
      ).pipe(
        tap({
          next: (event) => {
            if (rotatesSession && event instanceof HttpResponse) csrf.invalidate();
          },
          error: (error: unknown) => {
            if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) {
              csrf.invalidate();
            }
          },
        }),
      ),
    ),
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthApiService } from './auth-api.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authApi = inject(AuthApiService);
  const router = inject(Router);

  return authApi.getCurrentUser().pipe(
    map((user) =>
      user.role?.toUpperCase().replace('ROLE_', '') === 'ADMIN'
        ? true
        : router.createUrlTree(['/'], { queryParams: { adminDenied: true } }),
    ),
    catchError(() =>
      of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })),
    ),
  );
};

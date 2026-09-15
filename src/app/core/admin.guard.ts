import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.checkSession().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }
      return user.role?.toUpperCase().replace('ROLE_', '') === 'ADMIN'
        ? true
        : router.createUrlTree(['/'], { queryParams: { adminDenied: true } });
    }),
  );
};

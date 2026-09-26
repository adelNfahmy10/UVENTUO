import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const userId = localStorage.getItem('uvID');

  const allowedUsers = [
    '4lxgOSRBz6YfSAF3K9QDQwNm4Z12'
  ];

  if (userId && allowedUsers.includes(userId)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const userId = localStorage.getItem('chaosUID');

  const allowedUsers = [
    'JZLlIb2UADfG1b8jyCNEzoCKRW22',
    'Pnaj8KD0JKWJG7GfvP4LyXx9nNN2'
  ];

  if (userId && allowedUsers.includes(userId)) {
    return true;
  }

  return router.createUrlTree(['/']);
};

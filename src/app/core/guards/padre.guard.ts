import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

const ROLES_PADRE = ['padre', 'familiar', 'apoderado'];

export const padreGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rol = auth.obtenerRol().toLowerCase();

  if (ROLES_PADRE.includes(rol)) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

const ROLES_DOCENTE = ['docente', 'profesor'];

export const docenteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rol = auth.obtenerRol().toLowerCase();

  if (ROLES_DOCENTE.includes(rol)) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

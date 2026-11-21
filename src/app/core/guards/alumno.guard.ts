import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

const ROLES_ALUMNO = ['alumno', 'estudiante'];

export const alumnoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rol = auth.obtenerRol().toLowerCase();

  if (ROLES_ALUMNO.includes(rol)) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

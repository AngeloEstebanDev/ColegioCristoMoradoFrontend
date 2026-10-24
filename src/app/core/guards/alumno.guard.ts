import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

/**
 * Igual que admin.guard.ts: ajusta este arreglo al valor EXACTO que se
 * guarda en `usuarios.rol` para un alumno (p.ej. 'ALUMNO', 'Estudiante').
 */
const ROLES_ALUMNO = ['alumno', 'estudiante'];

/** Protege las rutas /home/alumno/**: solo entra si el rol es alumno. */
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

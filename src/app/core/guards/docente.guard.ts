import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

/**
 * Igual que admin.guard.ts: ajusta este arreglo al valor EXACTO que se
 * guarda en `usuarios.rol` para un docente (p.ej. 'DOCENTE', 'Profesor').
 */
const ROLES_DOCENTE = ['docente', 'profesor'];

/** Protege las rutas /home/docente/**: solo entra si el rol es docente. */
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

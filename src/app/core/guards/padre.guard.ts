import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

/**
 * Igual que admin.guard.ts: ajusta este arreglo al valor EXACTO que se
 * guarda en `usuarios.rol` para un padre/familiar (p.ej. 'PADRE', 'Apoderado').
 */
const ROLES_PADRE = ['padre', 'familiar', 'apoderado'];

/** Protege las rutas /home/padre/**: solo entra si el rol es padre/familiar. */
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

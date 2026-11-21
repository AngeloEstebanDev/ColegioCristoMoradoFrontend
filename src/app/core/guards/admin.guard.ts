import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

const ROLES_ADMIN = ['administrador', 'admin'];

const ROLES_DIRECTIVA = ['directivo', 'directiva', 'director'];

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rol = auth.obtenerRol().toLowerCase();

  if (ROLES_ADMIN.includes(rol) || ROLES_DIRECTIVA.includes(rol)) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const permisoGuard: CanActivateChildFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permiso: string | undefined = route.data?.['permiso'];
  if (!permiso || auth.tienePermiso(permiso)) return true;
  return router.createUrlTree(['/home', 'admin', 'inicio']);
};

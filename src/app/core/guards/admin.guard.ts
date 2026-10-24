import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

/**
 * IMPORTANTE: ajusta este arreglo al valor EXACTO que se guarda en la
 * columna `usuarios.rol` de la base de datos para el administrador
 * (ver Usuario.java). Se compara en minúsculas, así que solo agrega
 * el texto tal cual está en la BD (p.ej. 'ADMIN', 'Administrador', etc).
 */
const ROLES_ADMIN = ['administrador', 'admin'];

/** La Directiva usa el mismo panel que el administrador (según sus permisos). */
const ROLES_DIRECTIVA = ['directivo', 'directiva', 'director'];

/**
 * Protege las rutas /home/admin/**: solo entra si el rol del usuario
 * logeado corresponde a un administrador. Si en el futuro agregas más
 * roles (docente, padre...), crea un guard análogo por cada uno y
 * agrégalo como hijo de 'home' en app.routes.ts.
 */
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

/**
 * Revisa el permiso de cada página del panel (data.permiso en app.routes.ts).
 * Si la Directiva no lo tiene, vuelve al Inicio.
 */
export const permisoGuard: CanActivateChildFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permiso: string | undefined = route.data?.['permiso'];
  if (!permiso || auth.tienePermiso(permiso)) return true;
  return router.createUrlTree(['/home', 'admin', 'inicio']);
};

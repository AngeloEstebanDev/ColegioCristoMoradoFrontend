import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Agrega la cabecera X-Usuario-Id (usuario logeado) a cada petición al
 * backend. Con ella el backend revisa los permisos (Administrador / Directiva).
 */
export const usuarioInterceptor: HttpInterceptorFn = (req, next) => {
  let id: number | undefined;
  try {
    id = JSON.parse(localStorage.getItem('usuario') ?? 'null')?.id;
  } catch { /* sin sesión */ }
  return next(id ? req.clone({ setHeaders: { 'X-Usuario-Id': String(id) } }) : req);
};

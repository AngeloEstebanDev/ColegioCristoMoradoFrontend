import { HttpInterceptorFn } from '@angular/common/http';

export const usuarioInterceptor: HttpInterceptorFn = (req, next) => {
  let id: number | undefined;
  try {
    id = JSON.parse(localStorage.getItem('usuario') ?? 'null')?.id;
  } catch {  }
  return next(id ? req.clone({ setHeaders: { 'X-Usuario-Id': String(id) } }) : req);
};

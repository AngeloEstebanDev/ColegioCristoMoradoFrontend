import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { usuarioInterceptor } from './core/interceptors/usuario.interceptor';

/**
 * Configuración global de Angular: rutas, cliente HTTP, interceptores y otros proveedores que usa toda
 * la app.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // X-Usuario-Id en cada petición: el backend valida los permisos con él.
    provideHttpClient(withInterceptors([usuarioInterceptor]))
  ]
};
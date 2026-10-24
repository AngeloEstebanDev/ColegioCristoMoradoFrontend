import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Siderbar, SidebarEntry } from '../siderbar/siderbar';
import { Navbar } from '../navbar/navbar';
import { AuthService } from '../../../services/auth';
import { ADMIN_SIDEBAR_ITEMS } from '../../../admin/admin-sidebar.config';
import { DOCENTE_SIDEBAR_ITEMS } from '../../../pages/docente/docente-sidebar.config';
import { ALUMNO_SIDEBAR_ITEMS } from '../../../pages/alumno/alumno-sidebar.config';
import { PADRE_SIDEBAR_ITEMS } from '../../../pages/padre/padre-sidebar.config';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PerfilService } from '../../../core/services/perfil.service';
import { FotoService } from '../../../core/services/foto.service';
import { AvisosInicio } from '../../components/avisos-inicio/avisos-inicio';

@Component({
  imports: [CommonModule, RouterOutlet, Siderbar, Navbar, AvisosInicio],
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.html',
})
export class Layout {

  private router = inject(Router);
  private authService = inject(AuthService);

  readonly notificaciones = inject(NotificacionService);
  readonly perfilService = inject(PerfilService);

  usuario = this.authService.obtenerUsuario();

  /** Menú lateral abierto en pantallas pequeñas (se cierra al navegar). */
  menuMovil = signal(false);

  /** Permisos del panel (Directiva). Se refrescan al entrar por si el admin los cambió. */
  permisos = signal<string[]>(this.usuario?.permisos ?? []);

  constructor() {
    inject(FotoService).cargar();
    if (this.usuario) {
      this.perfilService.obtener(this.usuario.id).subscribe({
        next: (p) => {
          this.authService.actualizarPermisos(p.permisos ?? []);
          this.permisos.set(p.permisos ?? []);
        },
      });
    }
    // Contador de la campana: al cambiar de página y cada 60 segundos.
    this.notificaciones.refrescar();
    const sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => { this.notificaciones.refrescar(); this.menuMovil.set(false); });
    const timer = setInterval(() => this.notificaciones.refrescar(), 60_000);
    inject(DestroyRef).onDestroy(() => { sub.unsubscribe(); clearInterval(timer); });
  }

  // Menú lateral según el rol logeado: cada rol tiene su propio archivo
  // de configuración (ver admin-sidebar.config.ts, docente-sidebar.config.ts,
  // etc). Agrega un nuevo 'if' aquí cuando sumes otro rol.
  itemsMenu = computed<SidebarEntry[]>(() => {
    const rol = (this.usuario?.rol ?? '').toLowerCase();
    if (rol === 'administrador' || rol === 'admin') {
      return ADMIN_SIDEBAR_ITEMS;
    }
    // Directiva: mismo menú del administrador, solo con los módulos permitidos.
    if (rol === 'directivo' || rol === 'directiva' || rol === 'director') {
      const permisos = this.permisos();
      return ADMIN_SIDEBAR_ITEMS.filter(item => !item.permiso || permisos.includes(item.permiso));
    }
    if (rol === 'docente' || rol === 'profesor') {
      return DOCENTE_SIDEBAR_ITEMS;
    }
    if (rol === 'alumno' || rol === 'estudiante') {
      return ALUMNO_SIDEBAR_ITEMS;
    }
    if (rol === 'padre' || rol === 'familiar' || rol === 'apoderado') {
      return PADRE_SIDEBAR_ITEMS;
    }
    return [];
  });

  // Título del navbar: se toma del `data.titulo` de la ruta hoja activa
  // (definido en app.routes.ts). Usamos el snapshot completo del Router
  // (no this.route.firstChild) porque las rutas sin componente como
  // 'admin' no siempre tienen su ActivatedRoute.snapshot listo en el
  // momento exacto en que Layout se construye.
  private obtenerTitulo(): string {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    return snapshot.data?.['titulo'] ?? 'Inicio';
  }

  tituloActivo = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.obtenerTitulo()),
      startWith(this.obtenerTitulo())
    ),
    { initialValue: 'Inicio' }
  );
}

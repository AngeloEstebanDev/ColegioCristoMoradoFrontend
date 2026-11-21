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

  menuMovil = signal(false);

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
    this.notificaciones.refrescar();
    const sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => { this.notificaciones.refrescar(); this.menuMovil.set(false); });
    const timer = setInterval(() => this.notificaciones.refrescar(), 60_000);
    inject(DestroyRef).onDestroy(() => { sub.unsubscribe(); clearInterval(timer); });
  }

  itemsMenu = computed<SidebarEntry[]>(() => {
    const rol = (this.usuario?.rol ?? '').toLowerCase();
    if (rol === 'administrador' || rol === 'admin') {
      return ADMIN_SIDEBAR_ITEMS;
    }
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

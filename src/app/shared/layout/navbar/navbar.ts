import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ConfirmService } from '../../../core/services/confirm.service';
import { enlaceSoporte } from '../../../core/utils/soporte';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
})
export class Navbar {
  private confirmar = inject(ConfirmService);

  @Input() titulo: string = 'Inicio';
  /** Botón ☰ (solo en pantallas pequeñas): abre el menú lateral. */
  @Output() abrirMenu = new EventEmitter<void>();
  @Input() usuarioNombre: string = 'Administrador General';
  @Input() usuarioCorreo: string = 'admin@cristonavado.edu.pe';
  @Input() notificaciones: number = 0;
  /** Foto de perfil (si el usuario subió una). */
  @Input() foto: string | null = null;
  /** Pestaña a abrir al hacer clic en la campana. */
  @Input() tabNotificaciones: 'comunicados' | 'mensajes' = 'comunicados';

  menuAbierto = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get iniciales(): string {
    return this.usuarioNombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('');
  }

  /** WhatsApp de soporte con el nombre del usuario en el mensaje. */
  get enlaceSoporte(): string {
    const u = this.authService.obtenerUsuario();
    return enlaceSoporte('Hola, necesito ayuda con el Portal de la I.E. 2092 Cristo Morado.' + (u ? ` Soy ${u.nombre} (usuario ${u.usuario}).` : ''));
  }

  /** Segmento de ruta (/home/{rolPath}/...) según el rol logeado. */
  get rolPath(): string {
    const rol = (this.authService.obtenerRol() ?? '').toLowerCase();
    if (['administrador', 'admin'].includes(rol)) return 'admin';
    if (['docente', 'profesor'].includes(rol)) return 'docente';
    if (['alumno', 'estudiante'].includes(rol)) return 'alumno';
    if (['padre', 'familiar', 'apoderado'].includes(rol)) return 'padre';
    return 'admin';
  }

  /** Nombre del rol bajo el nombre del usuario ("Estudiante", "Docente"...). */
  get rolVisible(): string {
    switch (this.rolPath) {
      case 'docente': return 'Docente';
      case 'alumno': return 'Estudiante';
      case 'padre': return 'Padre de familia';
      default: {
        const rol = (this.authService.obtenerRol() ?? '').toLowerCase();
        return ['directivo', 'directiva', 'director'].includes(rol) ? 'Directiva' : 'Administrador';
      }
    }
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-navbar')) {
      this.menuAbierto = false;
    }
  }

  irANotificaciones(): void {
    this.router.navigate(['/home', this.rolPath, 'comunicados'], {
      queryParams: { tab: this.tabNotificaciones },
    });
  }

  async cerrarSesion(): Promise<void> {
    this.menuAbierto = false;
    if (!await this.confirmar.pedir('¿Deseas cerrar sesión?')) return;
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
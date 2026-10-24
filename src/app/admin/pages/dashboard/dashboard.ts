import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ActividadReciente, DashboardStats } from '../../../core/models/dashboard.model';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  ruta: string[];
  icono: string;
  color: string;
}

@Component({
  imports: [CommonModule, RouterLink, DatePipe],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {

  cargando = signal(true);
  error = signal<string | null>(null);

  stats = signal<DashboardStats>({
    usuariosActivos: 0,
    totalEstudiantes: 0,
    totalPadres: 0,
    totalDocentes: 0,
  });

  actividad = signal<ActividadReciente[]>([]);

  /** Los accesos rápidos son de "Gestión de Usuarios": la Directiva solo los ve con ese permiso. */
  readonly puedeGestionarUsuarios = inject(AuthService).tienePermiso('USUARIOS');

  accesos: AccesoRapido[] = [
    {
      titulo: 'Gestionar usuarios y roles',
      descripcion: 'Administra los accesos, roles y permisos del sistema.',
      ruta: ['/home', 'admin', 'usuarios', 'administrativo'],
      icono: 'M8.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19.5c.5-3 2.8-5 6-5s5.5 2 6 5M15.3 14.6c2.4.2 4.2 1.9 4.7 4.4',
      color: '#4A1F52',
    },
    {
      titulo: 'Registrar estudiante',
      descripcion: 'Agrega y gestiona la información de los estudiantes.',
      ruta: ['/home', 'admin', 'usuarios', 'alumnos'],
      icono: 'M12 3 2 8l10 5 10-5-10-5ZM6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
      color: '#B08900',
    },
    {
      titulo: 'Registrar padre de familia',
      descripcion: 'Registra y administra la información de los padres de familia.',
      ruta: ['/home', 'admin', 'usuarios', 'padres'],
      icono: 'M8.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19.5c.5-3 2.8-5 6-5s5.5 2 6 5M15.3 14.6c2.4.2 4.2 1.9 4.7 4.4',
      color: '#A62639',
    },
    {
      titulo: 'Gestionar docentes',
      descripcion: 'Administra la información del personal docente.',
      ruta: ['/home', 'admin', 'usuarios', 'docentes'],
      icono: 'M12 3 2 8l10 5 10-5-10-5ZM6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
      color: '#2E1233',
    },
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.cargando.set(true);
    this.dashboardService.obtenerStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => this.error.set('No se pudo conectar con el servidor.'),
    });
    this.cargarActividad();
  }

  /** Últimas acciones del sistema (inicios de sesión, registros, ediciones y eliminaciones). */
  cargarActividad(): void {
    this.cargando.set(true);
    this.dashboardService.obtenerActividadReciente().subscribe({
      next: (a) => { this.actividad.set(a); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set('No se pudo conectar con el servidor.'); },
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Exitoso': return 'bg-[#E7F3EA] text-[#1E7A3B]';
      case 'En proceso': return 'bg-[#FDF1DC] text-[#B08900]';
      case 'Advertencia': return 'bg-[#FDF1DC] text-[#9A6B00]';
      case 'Error': return 'bg-[#FBE7E9] text-[#A62639]';
      default: return 'bg-[#EFEAF3] text-[#4A1F52]';
    }
  }
}

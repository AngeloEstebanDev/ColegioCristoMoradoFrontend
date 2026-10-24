import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListaComunicados } from './lista-comunicados/lista-comunicados';
import { BandejaMensajes } from './bandeja-mensajes/bandeja-mensajes';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../services/auth';

type Pestana = 'comunicados' | 'mensajes';

/**
 * Vista "Comunicados" compartida por los 4 roles (igual que Perfil):
 * - Pestaña Comunicados: la administración los crea; todos los reciben
 *   según su rol. Los marcados como anuncio salen en grande.
 * - Pestaña Mensajes: mensajería entre usuarios (compañeros de salón,
 *   docentes, padres y administración).
 */
@Component({
  imports: [CommonModule, ListaComunicados, BandejaMensajes],
  selector: 'app-comunicados',
  templateUrl: './comunicados.html',
})
export class Comunicados implements OnInit {

  private route = inject(ActivatedRoute);
  readonly notificaciones = inject(NotificacionService);

  pestana = signal<Pestana>('comunicados');
  readonly esAlumno = ['alumno', 'estudiante'].includes((inject(AuthService).obtenerRol() ?? '').toLowerCase());

  ngOnInit(): void {
    // /comunicados?tab=mensajes abre directamente la mensajería (lo usa la campana)
    this.route.queryParamMap.subscribe(q => {
      if (q.get('tab') === 'mensajes') this.pestana.set('mensajes');
      else if (q.get('tab') === 'comunicados') this.pestana.set('comunicados');
    });
    this.notificaciones.refrescar();
  }
}

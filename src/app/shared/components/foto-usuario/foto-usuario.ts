import { Component, computed, inject, input, signal } from '@angular/core';
import { FotoService } from '../../../core/services/foto.service';

/**
 * Foto de perfil dentro de un avatar. Se coloca dentro del círculo del avatar:
 *   <span class="w-9 h-9 rounded-full overflow-hidden ..."><app-foto [usuarioId]="x.usuarioId">{{ iniciales(x.nombre) }}</app-foto></span>
 * Si el usuario tiene foto (o avatar del colegio) se muestra la imagen; si no, el contenido (las iniciales).
 */
@Component({
  selector: 'app-foto',
  standalone: true,
  host: { style: 'display: contents' },
  template: `@if (url(); as u) {<img [src]="u" alt="" loading="lazy" class="w-full h-full object-cover bg-[#EFEAF3]" (error)="fallo.set(true)" />} @else {<ng-content />}`,
})
export class FotoUsuario {
  /** Servicio FotoService (inyectado por Angular). */
  private fotos = inject(FotoService);
  /** Dato de entrada «usuario id» que envía el componente padre. */
  usuarioId = input<number | null | undefined>(null);
  /** Foto ya conocida (data URL o ruta); si viene, se usa en lugar del índice. */
  foto = input<string | null | undefined>(null);
  /** Estado (signal): fallo. */
  fallo = signal(false);
  /** Valor calculado (computed): url. Se actualiza solo. */
  url = computed(() => this.fallo() ? null : (this.foto() || this.fotos.src(this.usuarioId())));

  /** Constructor: Angular le entrega (inyecta) los servicios que usa. */
  constructor() {
    this.fotos.cargar();
  }
}

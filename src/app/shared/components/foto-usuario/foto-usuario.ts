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
  private fotos = inject(FotoService);
  usuarioId = input<number | null | undefined>(null);
  /** Foto ya conocida (data URL o ruta); si viene, se usa en lugar del índice. */
  foto = input<string | null | undefined>(null);
  fallo = signal(false);
  url = computed(() => this.fallo() ? null : (this.foto() || this.fotos.src(this.usuarioId())));

  constructor() {
    this.fotos.cargar();
  }
}

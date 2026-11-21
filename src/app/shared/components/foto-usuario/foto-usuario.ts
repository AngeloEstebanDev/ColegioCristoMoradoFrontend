import { Component, computed, inject, input, signal } from '@angular/core';
import { FotoService } from '../../../core/services/foto.service';

@Component({
  selector: 'app-foto',
  standalone: true,
  host: { style: 'display: contents' },
  template: `@if (url(); as u) {<img [src]="u" alt="" loading="lazy" class="w-full h-full object-cover bg-[#EFEAF3]" (error)="fallo.set(true)" />} @else {<ng-content />}`,
})
export class FotoUsuario {
  private fotos = inject(FotoService);
  usuarioId = input<number | null | undefined>(null);
  foto = input<string | null | undefined>(null);
  fallo = signal(false);
  url = computed(() => this.fallo() ? null : (this.foto() || this.fotos.src(this.usuarioId())));

  constructor() {
    this.fotos.cargar();
  }
}

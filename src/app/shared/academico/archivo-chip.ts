import { Component, inject, input } from '@angular/core';
import { ArchivoInfo } from '../../core/models/aula.model';
import { ArchivoService, extension, tamanioLegible } from '../../core/services/archivo.service';

/** Archivo adjunto con su botón de descarga. */
@Component({
  selector: 'app-archivo-chip',
  standalone: true,
  template: `
    @if (archivo(); as a) {
      <button type="button" (click)="$event.stopPropagation(); archivos.descargar(a)" [title]="'Descargar ' + a.nombre"
              class="group inline-flex items-center gap-2.5 max-w-full pl-1.5 pr-3 py-1.5 rounded-lg border border-[#E3D5C4] bg-[#FAF6EF] hover:bg-[#F0E6D8] text-left transition-colors">
        <span class="w-9 h-9 shrink-0 rounded-md bg-white border border-[#E3D5C4] flex items-center justify-center text-[9.5px] font-bold text-[#4A1F52]">{{ ext(a.nombre) }}</span>
        <span class="min-w-0">
          <span class="block text-[12.5px] font-medium text-[#241521] truncate">{{ a.nombre }}</span>
          <span class="block text-[11px] text-[#6B5A67]">{{ tam(a.tamanio) }} · Descargar</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 shrink-0 text-[#4A1F52] group-hover:translate-y-0.5 transition-transform" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>
      </button>
    }
  `,
})
export class ArchivoChip {
  readonly archivos = inject(ArchivoService);
  archivo = input<ArchivoInfo | null | undefined>(null);
  readonly ext = extension;
  readonly tam = tamanioLegible;
}

import { Component, input } from '@angular/core';

/** Encabezado de página con ícono (mismo estilo que el resto del sistema). */
@Component({
  selector: 'app-encabezado',
  standalone: true,
  template: `
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-[#EFEAF3] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 text-[#4A1F52]" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="icono()" />
          </svg>
        </div>
        <div>
          <h2 class="font-serif font-bold text-2xl text-[#241521] leading-tight">{{ titulo() }}</h2>
          @if (subtitulo()) { <p class="text-[13.5px] text-[#6B5A67] mt-0.5">{{ subtitulo() }}</p> }
        </div>
      </div>
      <ng-content />
    </div>
  `,
})
export class Encabezado {
  titulo = input.required<string>();
  subtitulo = input<string | null>(null);
  icono = input('M4 4h16v16H4z');
}

/** Íconos (path SVG 24x24) usados en los encabezados y menús. */
export const ICONOS = {
  aula: 'M12 3 2 8l10 5 10-5-10-5ZM6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5',
  tareas: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2ZM9 13l2 2 4-4',
  notas: 'M4 19h16M7 16v-5M12 16V7M17 16v-8',
  asistencia: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 10 2 2 4-4',
  historial: 'M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4M3 4v4h4',
  citas: 'M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM12 13v3l2 1',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  reportes: 'M4 19h16M7 16v-5M12 16V7M17 16v-8',
  inicio: 'M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z',
  cursos: 'M12 6.5C10.4 5.3 8 4.5 5 4.5c-1 0-2 .1-3 .3v14c1-.2 2-.3 3-.3 3 0 5.4.8 7 2 1.6-1.2 4-2 7-2 1 0 2 .1 3 .3v-14c-1-.2-2-.3-3-.3-3 0-5.4.8-7 2ZM12 6.5v14',
};

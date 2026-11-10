import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MiHorario } from '../../core/models/mi-horario.model';
import { BloqueHorario, DIAS_SEMANA, aHora, aMinutos, FilaHorario, filasHorario, filaDeHora } from '../../core/models/horario.model';


/**
 * Horario semanal de una sección (solo lectura), igual al del dashboard del alumno.
 * Lo usa el padre para ver el horario de cada hijo. Al tocar un bloque muestra su detalle.
 */
@Component({
  selector: 'app-horario-semana',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (!hayHorario()) {
      <div class="bg-white rounded-2xl border border-[#E3D5C4] flex flex-col items-center text-center px-6 py-10">
        <div class="w-16 h-16 rounded-full bg-[#EFEAF3] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8 text-[#4A1F52]" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9.5 14.5l5 5M14.5 14.5l-5 5"/></svg>
        </div>
        <h4 class="mt-4 font-serif font-bold text-[17px] text-[#241521]">Horario no disponible</h4>
        <p class="mt-1 max-w-md text-[13px] text-[#6B5A67]">
          {{ datos()?.matriculado
            ? 'La sección todavía no tiene cursos en el horario. Cuando el colegio lo publique, aparecerá aquí.'
            : 'Aún no está matriculado(a) en una sección. Cuando el colegio lo asigne, aquí verás su horario.' }}
        </p>
      </div>
    } @else if (datos(); as d) {
      <div class="bg-white rounded-2xl border border-[#E3D5C4] shadow-sm overflow-x-auto p-2">
        <div class="grid min-w-[760px]" style="grid-template-columns: 78px repeat(5, minmax(130px, 1fr));" [style.grid-template-rows]="plantillaFilas()">
          <div class="border-b border-r border-[#E3D5C4] bg-[#FAF6EF] rounded-tl-lg" style="grid-row: 1; grid-column: 1;"></div>
          @for (dia of dias; track dia; let di = $index) {
            <div class="flex items-center justify-center border-b border-[#E3D5C4] text-[12px] font-bold tracking-wide uppercase"
                 [ngClass]="di + 1 === hoy ? 'bg-[#EFEAF3] text-[#4A1F52]' : 'bg-[#FAF6EF] text-[#241521]'"
                 [class.border-r]="di < 4" [class.rounded-tr-lg]="di === 4" [style.grid-row]="1" [style.grid-column]="di + 2">
              {{ dia }}@if (di + 1 === hoy) { <span class="ml-1.5 px-1.5 py-0.5 rounded bg-[#4A1F52] text-[9.5px] text-white normal-case">Hoy</span> }
            </div>
          }
          @for (f of filas(); track f.inicio; let fi = $index) {
            <div class="flex flex-col justify-center px-2 border-r border-b border-[#F0E6D8] text-[10.5px] leading-tight"
                 [ngClass]="f.receso ? 'bg-[#E8E1EC] font-bold text-[#241521]' : 'text-[#4A1F52]'"
                 [style.grid-row]="fi + 2" [style.grid-column]="1">
              <span>{{ aHora(f.inicio) }} -</span><span>{{ aHora(f.fin) }}</span>
            </div>
            @for (dia of dias; track dia; let di = $index) {
              @if (f.receso) {
                <div class="flex items-center justify-center bg-[#E8E1EC] border-b border-[#D9CDE0] text-[11px] font-medium tracking-wide text-[#4A1F52] uppercase"
                     [class.border-r]="di < 4" [style.grid-row]="fi + 2" [style.grid-column]="di + 2">Recreo</div>
              } @else {
                <div class="border-b border-[#F0E6D8]" [ngClass]="di + 1 === hoy ? 'bg-[#FAF6EF]/80' : ''"
                     [class.border-r]="di < 4" [style.grid-row]="fi + 2" [style.grid-column]="di + 2"></div>
              }
            }
          }
          @for (b of d.bloques; track $index) {
            <button type="button" (click)="seleccionado.set(b)"
                    class="relative z-10 m-[3px] flex flex-col justify-start rounded-lg px-2.5 py-1.5 text-left shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-px transition"
                    [style.background]="b.color" [style.color]="textoSobre(b.color)"
                    [style.grid-row]="filaDe(b.horaInicio) + ' / ' + filaDe(b.horaFin, true)" [style.grid-column]="b.dia + 1"
                    [title]="b.curso + ' · ' + b.horaInicio + ' - ' + b.horaFin + (b.docente ? ' · ' + b.docente : '')">
              <span class="block font-semibold text-[12.5px] leading-tight truncate">{{ b.curso }}</span>
              @if (filasDe(b) >= 2) { <span class="block text-[11px] opacity-90">{{ b.horaInicio }} - {{ b.horaFin }}</span> }
              @if (filasDe(b) >= 4 && b.docente) { <span class="block text-[10.5px] opacity-80 truncate mt-0.5">{{ b.docente }}</span> }
            </button>
          }
        </div>
      </div>
    }

    @if (seleccionado(); as b) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#241521]/45" (click)="seleccionado.set(null)"></div>
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="h-2" [style.background]="b.color"></div>
          <div class="p-5 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-serif font-bold text-[18px] text-[#241521]">{{ b.curso }}</h3>
              <button type="button" (click)="seleccionado.set(null)" class="text-[#6B5A67] hover:text-[#241521]" title="Cerrar">✕</button>
            </div>
            <dl class="space-y-2 text-[13px]">
              <div class="flex justify-between"><dt class="text-[#6B5A67]">Día</dt><dd class="font-medium text-[#241521]">{{ dias[b.dia - 1] }}</dd></div>
              <div class="flex justify-between"><dt class="text-[#6B5A67]">Hora</dt><dd class="font-medium text-[#241521]">{{ b.horaInicio }} - {{ b.horaFin }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-[#6B5A67]">Docente</dt><dd class="font-medium text-[#241521] text-right">{{ b.docente || 'Por asignar' }}</dd></div>
            </dl>
            @if (enlace()) {
              <a [routerLink]="enlace()" class="block text-center text-[13px] font-medium text-[#4A1F52] hover:underline pt-1">{{ textoEnlace() }}</a>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class HorarioSemana {
  readonly datos = input<MiHorario | null>(null);
  /** Enlace opcional en el detalle del bloque (p. ej. a Mis Hijos). */
  readonly enlace = input<string | null>(null);
  readonly textoEnlace = input('Ver cursos');

  readonly dias = DIAS_SEMANA;
  readonly aHora = aHora;
  /** 1 = lunes ... 5 = viernes; 0 si es fin de semana. */
  readonly hoy = (() => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d : 0; })();
  seleccionado = signal<BloqueHorario | null>(null);

  hayHorario = computed(() => !!this.datos()?.matriculado && (this.datos()?.bloques.length ?? 0) > 0 && this.filas().length > 0);

  filas = computed<FilaHorario[]>(() => {
    const h = this.datos();
    if (!h?.inicio || !h.fin) return [];
    return filasHorario({ inicio: h.inicio!, fin: h.fin!, recesoInicio: h.recesoInicio, recesoFin: h.recesoFin, minutosBloque: h.minutosBloque }, this.datos()?.bloques ?? []);
  });

  plantillaFilas = computed(() => ['40px', ...this.filas().map(f => f.receso ? '36px' : '28px')].join(' '));

  filaDe(hora: string, esFin = false): number {
    return filaDeHora(this.filas(), hora, esFin) + 2;
  }

  filasDe(b: BloqueHorario): number {
    return (aMinutos(b.horaFin) - aMinutos(b.horaInicio)) / (this.datos()?.minutosBloque || 15);
  }

  textoSobre(color: string): string {
    const c = (color || '#4A1F52').replace('#', '');
    const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#241521' : '#FFFFFF';
  }
}

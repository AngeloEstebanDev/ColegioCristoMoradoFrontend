import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Actividad, Material } from '../../../../core/models/aula.model';
import { iniciales } from '../../../../core/utils/texto';

/**
 * Piezas visuales compartidas por las pestañas del curso del docente
 * (Contenido, Actividades, Asistencia y Exámenes).
 */

export type IconoTipo = 'doc' | 'texto' | 'enlace' | 'tarea' | 'cuestionario' | 'actividad' | 'examen';

export interface EstiloItem { etiqueta: string; color: string; fondo: string; icono: IconoTipo; }

export function estiloMaterial(m: Material): EstiloItem {
  if (m.tipo === 'ARCHIVO' || (!m.tipo && m.archivo)) return { etiqueta: 'Documento', color: '#9333EA', fondo: '#F3E8FD', icono: 'doc' };
  if (m.tipo === 'ENLACE' || (!m.tipo && m.enlace)) return { etiqueta: 'Enlace', color: '#0891B2', fondo: '#E0F3F8', icono: 'enlace' };
  return { etiqueta: 'Texto', color: '#2563EB', fondo: '#E6EEFB', icono: 'texto' };
}

export function estiloActividad(a: Actividad): EstiloItem {
  switch (a.tipo) {
    case 'CUESTIONARIO': return { etiqueta: 'Cuestionario', color: '#FFFFFF', fondo: '#F97316', icono: 'cuestionario' };
    case 'ACTIVIDAD': return { etiqueta: 'Actividad', color: '#0D9488', fondo: '#DDF3F1', icono: 'actividad' };
    default: return { etiqueta: 'Tarea', color: '#059669', fondo: '#E3F4EC', icono: 'tarea' };
  }
}

/** Ícono cuadrado de cada elemento del curso. */
@Component({
  selector: 'app-icono-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="rounded-xl flex items-center justify-center shrink-0" [ngClass]="tam" [style.background]="e.fondo" [style.color]="e.color">
      @switch (e.icono) {
        @case ('cuestionario') { <span class="font-bold text-[20px] leading-none">?</span> }
        @case ('tarea') {
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2ZM9 12h6M9 16h4"/></svg>
        }
        @case ('actividad') {
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        }
        @case ('enlace') {
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
        }
        @case ('examen') {
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 12h1M12 12h3M9 15.5h1M12 15.5h3M9 19h1M12 19h3"/></svg>
        }
        @default {
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h6"/></svg>
        }
      }
    </span>
  `,
})
export class IconoItem {
  @Input({ required: true }) e!: EstiloItem;
  @Input() tam = 'w-11 h-11';
}

/** Foto del alumno (o sus iniciales). */
@Component({
  selector: 'app-avatar-persona',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="rounded-full shrink-0 overflow-hidden flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm"
          [ngClass]="tam" style="background:radial-gradient(circle at 35% 30%, #6B3474, #2E1233 75%)">
      @if (foto) { <img [src]="foto" alt="" class="w-full h-full object-cover bg-[#EFEAF3]" /> } @else { {{ iniciales(nombre) }} }
    </span>
  `,
})
export class AvatarPersona {
  @Input() nombre: string | null = '';
  @Input() foto: string | null | undefined = null;
  @Input() tam = 'w-10 h-10 text-[12.5px]';
  readonly iniciales = iniciales;
}

/** Pastilla "Activo" / "Oculto". */
@Component({
  selector: 'app-chip-visible',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3EA] text-[12.5px] font-medium text-[#1E7A3B] whitespace-nowrap">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z"/></svg>
        {{ textoActivo }}
      </span>
    } @else {
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAF0] text-[12.5px] font-medium text-[#5B4A5E] whitespace-nowrap">
        <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c5 0 9 4.5 10 7a12 12 0 0 1-2.7 3.8M6.3 6.3C3.9 7.8 2.5 10 2 12c1 2.5 5 7 10 7a9.6 9.6 0 0 0 4.2-.9"/></svg>
        {{ textoOculto }}
      </span>
    }
  `,
})
export class ChipVisible {
  @Input() visible = true;
  @Input() textoActivo = 'Activo';
  @Input() textoOculto = 'Oculto';
}

/** "2026-03-21" -> Date local */
export function aFecha(iso: string): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function aIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "07:45" -> "7:45 a. m." */
export function horaAmPm(h: string | null | undefined): string {
  if (!h) return '—';
  const [hh, mm] = h.split(':').map(Number);
  const sufijo = hh < 12 ? 'a. m.' : 'p. m.';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${sufijo}`;
}

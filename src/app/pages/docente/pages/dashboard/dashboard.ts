import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { AuthService } from '../../../../services/auth';
import { BloqueDocente, HorarioDocente } from '../../../../core/models/mi-horario.model';
import { DIAS_SEMANA, aHora, aMinutos } from '../../../../core/models/horario.model';

/** Píxeles por minuto en la grilla (15 min = 28 px). */
const PX = 28 / 15;

/**
 * Dashboard del docente: bienvenida, resumen (cursos a cargo, secciones, clases de hoy)
 * y su horario de la semana (turno mañana 7:30-13:15 y/o tarde 13:30-19:45, en filas de 15 minutos).
 */
@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-docente-dashboard',
  templateUrl: './dashboard.html',
})
export class DocenteDashboard implements OnInit {
  /** Servicio MiHorarioService (inyectado por Angular). */
  private horario = inject(MiHorarioService);
  /** Servicio AuthService (inyectado por Angular). */
  private auth = inject(AuthService);

  readonly dias = DIAS_SEMANA;
  readonly hoy = (() => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d : 0; })();
  readonly nombre = this.auth.obtenerUsuario()?.nombre ?? '';

  /** Estado (signal): datos. */
  datos = signal<HorarioDocente | null>(null);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): seleccionado. */
  seleccionado = signal<BloqueDocente | null>(null);

  /**
   * Rango de la grilla: los turnos donde el docente tiene clases (mañana 7:30-13:15, tarde 13:30-19:45),
   * ampliado si alguna clase sale de ellos. Sin clases se muestra el turno mañana.
   */
  inicio = computed(() => {
    const b = this.datos()?.bloques ?? [];
    const base = b.length && b.every(x => aMinutos(x.horaInicio) >= aMinutos('13:30')) ? aMinutos('13:30') : aMinutos('07:30');
    return Math.min(base, ...b.map(x => aMinutos(x.horaInicio)));
  });
  /** Valor calculado (computed): fin. Se actualiza solo. */
  fin = computed(() => {
    const b = this.datos()?.bloques ?? [];
    const base = b.some(x => aMinutos(x.horaFin) > aMinutos('13:15')) ? aMinutos('19:45') : aMinutos('13:15');
    return Math.max(base, ...b.map(x => aMinutos(x.horaFin)));
  });
  /** Valor calculado (computed): marcas. Se actualiza solo. */
  marcas = computed(() => {
    const l: number[] = [];
    for (let t = this.inicio(); t < this.fin(); t += 15) l.push(t);
    l.push(this.fin());
    return l;
  });
  /** Valor calculado (computed): alto. Se actualiza solo. */
  alto = computed(() => (this.fin() - this.inicio()) * PX);

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales. Pide los datos al backend con horario.docente() y actualiza la pantalla
   * cuando llega la respuesta.
   */
  ngOnInit(): void {
    this.horario.docente().subscribe({
      next: (d) => { this.datos.set(d); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo cargar tu horario.'); },
    });
  }

  /** Devuelve la hora de los datos de esta pantalla. */
  hora(min: number): string {
    const h = aHora(min);
    return h.startsWith('0') ? h.substring(1) : h;
  }

  /** Calcula «top» (devuelve un número). */
  top(min: number): number { return (min - this.inicio()) * PX; }

  /** Devuelve «bloques del». */
  bloquesDel(dia: number): BloqueDocente[] {
    return (this.datos()?.bloques ?? []).filter(b => b.dia === dia);
  }

  /** Devuelve el estilo de los datos de esta pantalla. */
  estilo(b: BloqueDocente): Record<string, string> {
    const ini = aMinutos(b.horaInicio), fin = aMinutos(b.horaFin);
    return {
      top: this.top(ini) + 'px',
      height: Math.max((fin - ini) * PX - 3, 22) + 'px',
      background: b.color || '#4A1F52',
      color: this.textoSobre(b.color),
    };
  }

  /** Calcula «minutos» (devuelve un número). */
  minutos(b: BloqueDocente): number { return aMinutos(b.horaFin) - aMinutos(b.horaInicio); }

  /** "5° Primaria" + "A" → "5° A Prim." */
  salon(b: BloqueDocente): string {
    const n = (b.grado || '').split(' ')[0];
    const nivel = (b.grado || '').includes('Secundaria') ? 'Sec.' : 'Prim.';
    return `${n} ${b.letra} ${nivel}`;
  }

  /** Devuelve el texto de sobre. */
  textoSobre(color: string): string {
    const c = (color || '#4A1F52').replace('#', '');
    const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#241521' : '#FFFFFF';
  }
}

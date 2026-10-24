import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { AulaService } from '../../../../core/services/aula.service';
import { AuthService } from '../../../../services/auth';
import { MiHorario } from '../../../../core/models/mi-horario.model';
import { Actividad } from '../../../../core/models/aula.model';
import { BloqueHorario, DIAS_SEMANA, aHora, aMinutos } from '../../../../core/models/horario.model';
import { infoGrado } from '../../../../core/models/seccion.model';

interface Fila { inicio: number; fin: number; receso: boolean; }

/**
 * Dashboard del alumno: bienvenida, resumen (cursos, actividades pendientes, salón)
 * y su horario de la semana (solo lectura). Sin horario: "Curso no disponible".
 */
@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-alumno-dashboard',
  templateUrl: './dashboard.html',
})
export class AlumnoDashboard implements OnInit {

  private miHorarioService = inject(MiHorarioService);
  private aula = inject(AulaService);
  private auth = inject(AuthService);

  readonly dias = DIAS_SEMANA;
  readonly aHora = aHora;
  /** 1 = lunes ... 5 = viernes; 0 si es fin de semana. */
  readonly hoy = (() => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d : 0; })();
  readonly nombre = this.auth.obtenerUsuario()?.nombre ?? '';

  datos = signal<MiHorario | null>(null);
  actividades = signal<Actividad[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  seleccionado = signal<BloqueHorario | null>(null);

  titulo = computed(() => infoGrado(this.datos()?.grado)?.titulo ?? this.datos()?.grado ?? '');
  nivel = computed(() => (this.datos()?.grado ?? '').includes('Secundaria') ? 'Secundaria' : 'Primaria');
  hayHorario = computed(() => !!this.datos()?.matriculado && (this.datos()?.bloques.length ?? 0) > 0);
  totalCursos = computed(() => this.datos()?.cursos.length ?? 0);
  /** Tareas y cuestionarios que aún puede entregar (en plazo y sin entregar). */
  pendientes = computed(() => this.actividades().filter(a => a.situacion === 'PENDIENTE' && !a.vencida));
  filas = computed<Fila[]>(() => {
    const h = this.datos();
    if (!h?.inicio || !h.fin || !h.recesoInicio || !h.recesoFin) return [];
    const paso = h.minutosBloque || 15;
    const ini = aMinutos(h.inicio), fin = aMinutos(h.fin), rIni = aMinutos(h.recesoInicio), rFin = aMinutos(h.recesoFin);
    const filas: Fila[] = [];
    for (let t = ini; t < fin;) {
      if (t === rIni) { filas.push({ inicio: rIni, fin: rFin, receso: true }); t = rFin; continue; }
      filas.push({ inicio: t, fin: t + paso, receso: false });
      t += paso;
    }
    return filas;
  });

  plantillaFilas = computed(() => ['40px', ...this.filas().map(f => f.receso ? '40px' : '30px')].join(' '));

  ngOnInit(): void {
    this.miHorarioService.obtener().subscribe({
      next: (d) => { this.datos.set(d); this.cargando.set(false); },
      error: (err) => { this.cargando.set(false); this.error.set(err?.error?.mensaje ?? 'No se pudo cargar tu horario.'); },
    });
    this.aula.misActividades().subscribe({
      next: (l) => this.actividades.set(l),
      error: () => { /* el resumen muestra 0 si falla */ },
    });
  }

  filaDe(hora: string): number {
    const m = aMinutos(hora);
    const i = this.filas().findIndex(f => f.inicio === m);
    return (i < 0 ? this.filas().length : i) + 2;
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

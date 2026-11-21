import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { AulaService } from '../../../../core/services/aula.service';
import { AuthService } from '../../../../services/auth';
import { MiHorario } from '../../../../core/models/mi-horario.model';
import { Actividad } from '../../../../core/models/aula.model';
import { BloqueHorario, DIAS_SEMANA, aHora, aMinutos, FilaHorario, filasHorario, filaDeHora } from '../../../../core/models/horario.model';
import { infoGrado } from '../../../../core/models/seccion.model';


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

  /** Servicio MiHorarioService (inyectado por Angular). */
  private miHorarioService = inject(MiHorarioService);
  /** Servicio AulaService (inyectado por Angular). */
  private aula = inject(AulaService);
  /** Servicio AuthService (inyectado por Angular). */
  private auth = inject(AuthService);

  readonly dias = DIAS_SEMANA;
  readonly aHora = aHora;
  /** 1 = lunes ... 5 = viernes; 0 si es fin de semana. */
  readonly hoy = (() => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d : 0; })();
  readonly nombre = this.auth.obtenerUsuario()?.nombre ?? '';

  /** Estado (signal): datos. */
  datos = signal<MiHorario | null>(null);
  /** Estado (signal): actividades. */
  actividades = signal<Actividad[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): seleccionado. */
  seleccionado = signal<BloqueHorario | null>(null);

  /** Valor calculado (computed): título. Se actualiza solo. */
  titulo = computed(() => infoGrado(this.datos()?.grado)?.titulo ?? this.datos()?.grado ?? '');
  /** Valor calculado (computed): nivel. Se actualiza solo. */
  nivel = computed(() => (this.datos()?.grado ?? '').includes('Secundaria') ? 'Secundaria' : 'Primaria');
  /** Valor calculado (computed): hay horario. Se actualiza solo. */
  hayHorario = computed(() => !!this.datos()?.matriculado && (this.datos()?.bloques.length ?? 0) > 0);
  /** Valor calculado (computed): total cursos. Se actualiza solo. */
  totalCursos = computed(() => this.datos()?.cursos.length ?? 0);
  /** Tareas y cuestionarios que aún puede entregar (en plazo y sin entregar). */
  pendientes = computed(() => this.actividades().filter(a => a.situacion === 'PENDIENTE' && !a.vencida));
  filas = computed<FilaHorario[]>(() => {
    const h = this.datos();
    if (!h?.inicio || !h.fin) return [];
    return filasHorario({ inicio: h.inicio!, fin: h.fin!, recesoInicio: h.recesoInicio, recesoFin: h.recesoFin, minutosBloque: h.minutosBloque }, this.datos()?.bloques ?? []);
  });

  /** Valor calculado (computed): plantilla filas. Se actualiza solo. */
  plantillaFilas = computed(() => ['40px', ...this.filas().map(f => f.receso ? '40px' : '30px')].join(' '));

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales. Pide los datos al backend con miHorarioService.obtener(),
   * aula.misActividades() y actualiza la pantalla cuando llega la respuesta.
   */
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

  /** Calcula «fila de» (devuelve un número). */
  filaDe(hora: string, esFin = false): number {
    return filaDeHora(this.filas(), hora, esFin) + 2;
  }

  /** Calcula «filas de» (devuelve un número). */
  filasDe(b: BloqueHorario): number {
    return (aMinutos(b.horaFin) - aMinutos(b.horaInicio)) / (this.datos()?.minutosBloque || 15);
  }

  /** Devuelve el texto de sobre. */
  textoSobre(color: string): string {
    const c = (color || '#4A1F52').replace('#', '');
    const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#241521' : '#FFFFFF';
  }
}

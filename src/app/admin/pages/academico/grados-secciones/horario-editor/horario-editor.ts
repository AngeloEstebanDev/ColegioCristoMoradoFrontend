import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SeccionService } from '../../../../../core/services/seccion.service';
import { BloqueHorario, DIAS_SEMANA, Horario, aHora, aMinutos, FilaHorario, filasHorario, filaDeHora } from '../../../../../core/models/horario.model';
import { CursoSeccion, infoGrado } from '../../../../../core/models/seccion.model';
import { ConfirmService } from '../../../../../core/services/confirm.service';
import { ToastService } from '../../../../../core/services/toast.service';


/** Modelo FormBloque: describe la forma de los datos de «form bloque». */
interface FormBloque {
  indice: number | null;          // null = bloque nuevo
  seccionCursoId: number | null;
  dia: number;
  inicio: string;
  fin: string;
}

/**
 * Editor de horario de una sección (se abre en una ventana nueva).
 * El cuadro depende del turno: Mañana 07:30-13:15 (recreo 10:15-10:45), Tarde 13:30-19:45 (recreo 16:15-16:45),
 * en bloques de 15 minutos y con el receso marcado.
 */
@Component({
  selector: 'app-horario-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horario-editor.html',
})
export class HorarioEditor implements OnInit {
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);

  /** Servicio SeccionService (inyectado por Angular). */
  private seccionService = inject(SeccionService);
  /** Servicio ActivatedRoute (inyectado por Angular). */
  private route = inject(ActivatedRoute);
  /** Servicio Router (inyectado por Angular). */
  private router = inject(Router);

  readonly dias = DIAS_SEMANA;
  readonly aHora = aHora;

  /** Estado (signal): horario. */
  horario = signal<Horario | null>(null);
  /** Estado (signal): cursos. */
  cursos = signal<CursoSeccion[]>([]);
  /** Estado (signal): bloques. */
  bloques = signal<BloqueHorario[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): guardando. */
  guardando = signal(false);
  /** Estado (signal): sucio. */
  sucio = signal(false);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): aviso. */
  aviso = signal<string | null>(null);

  /** Estado (signal): form. */
  form = signal<FormBloque | null>(null);
  /** Estado (signal): error form. */
  errorForm = signal<string | null>(null);

  /** Valor calculado (computed): título. Se actualiza solo. */
  titulo = computed(() => infoGrado(this.horario()?.grado)?.titulo ?? this.horario()?.grado ?? '');

  /** Filas del cuadro: bloques de 15 min y una fila para el receso. */
  filas = computed<FilaHorario[]>(() => {
    const h = this.horario();
    if (!h?.inicio || !h.fin) return [];
    return filasHorario(h, this.bloques());
  });

  /** grid-template-rows: cabecera + filas (el receso un poco más alto). */
  plantillaFilas = computed(() => ['40px', ...this.filas().map(f => f.receso ? '40px' : '30px')].join(' '));

  /** Valor calculado (computed): cursos activos. Se actualiza solo. */
  cursosActivos = computed(() => this.cursos().filter(c => c.estado === 'Activo'));

  /** Horas de inicio posibles (dentro del turno y sin el receso). */
  opcionesInicio = computed(() => this.filas().filter(f => !f.receso && !f.fuera).map(f => aHora(f.inicio)));

  /** Horas de fin posibles para el inicio elegido: hasta el receso o el fin del turno. */
  opcionesFin = computed(() => {
    const f = this.form();
    if (!f) return [];
    const ini = aMinutos(f.inicio);
    const res: string[] = [];
    for (const fila of this.filas()) {
      if (fila.inicio < ini) continue;
      if (fila.receso || fila.fuera) break;
      res.push(aHora(fila.fin));
    }
    return res;
  });

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void {
    const id = this.id;
    forkJoin({ horario: this.seccionService.horario(id), seccion: this.seccionService.obtener(id) }).subscribe({
      next: ({ horario, seccion }) => {
        this.horario.set(horario);
        this.bloques.set(horario.bloques);
        this.cursos.set(seccion.cursos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo cargar el horario.');
      },
    });
  }

  /** Propiedad calculada (getter): devuelve id. */
  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  // ---------------- Cuadro ----------------

  /** Fila (en el grid) donde empieza / termina una hora. La fila 1 es la cabecera. */
  filaDe(hora: string, esFin = false): number {
    return filaDeHora(this.filas(), hora, esFin) + 2;
  }

  /** Blanco o negro según el color del curso, para que se lea bien. */
  textoSobre(color: string): string {
    const c = (color || '#4A1F52').replace('#', '');
    const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 170 ? '#241521' : '#FFFFFF';
  }

  /** Duración en filas de 15 min (para decidir cuánto texto cabe). */
  filasDe(b: BloqueHorario): number {
    return (aMinutos(b.horaFin) - aMinutos(b.horaInicio)) / (this.horario()?.minutosBloque || 15);
  }

  /** Indica «ocupado» (devuelve verdadero o falso). */
  ocupado(dia: number, inicio: number): boolean {
    return this.bloques().some(b => b.dia === dia && aMinutos(b.horaInicio) <= inicio && inicio < aMinutos(b.horaFin));
  }

  // ---------------- Ventana "Editar bloque" ----------------

  nuevoBloque(dia: number, fila: FilaHorario): void {
    if (fila.receso || fila.fuera || this.ocupado(dia, fila.inicio)) return;
    if (!this.cursosActivos().length) {
      this.error.set('Esta sección no tiene cursos activos. Agrégalos en la pestaña "Cursos" de la sección.');
      return;
    }
    // Fin sugerido: 45 min, sin pasar el recreo, el fin del turno ni el siguiente bloque.
    const ini = fila.inicio;
    let fin = ini;
    for (const f of this.filas()) {
      if (f.inicio < ini) continue;
      if (f.receso || f.fuera || this.ocupado(dia, f.inicio) || f.fin - ini > 45) break;
      fin = f.fin;
    }
    this.errorForm.set(null);
    this.form.set({ indice: null, seccionCursoId: null, dia, inicio: aHora(ini), fin: aHora(fin) });
  }

  /** Edita bloque. */
  editarBloque(i: number): void {
    const b = this.bloques()[i];
    this.errorForm.set(null);
    this.form.set({ indice: i, seccionCursoId: b.seccionCursoId, dia: b.dia, inicio: b.horaInicio, fin: b.horaFin });
  }

  /** Cambia form. */
  setForm<K extends keyof FormBloque>(campo: K, valor: FormBloque[K]): void {
    this.form.update(f => {
      if (!f) return f;
      const n = { ...f, [campo]: valor };
      // Si el fin ya no es válido para el nuevo inicio, se ajusta al primero posible.
      if (campo === 'inicio' && aMinutos(n.fin) <= aMinutos(n.inicio)) {
        n.fin = aHora(aMinutos(n.inicio) + (this.horario()?.minutosBloque || 15));
      }
      return n;
    });
    this.errorForm.set(null);
  }

  /** Cierra form. */
  cerrarForm(): void {
    this.form.set(null);
  }

  /** Aplica bloque. */
  aplicarBloque(): void {
    const f = this.form();
    if (!f) return;
    const curso = this.cursos().find(c => c.id === f.seccionCursoId);
    if (!curso) { this.errorForm.set('Selecciona el curso o asignatura.'); return; }
    const ini = aMinutos(f.inicio), fin = aMinutos(f.fin);
    if (fin <= ini) { this.errorForm.set('La hora fin debe ser mayor que la hora de inicio.'); return; }
    if (!this.opcionesFin().includes(f.fin)) { this.errorForm.set('El bloque no puede cruzar el recreo ni salir del turno.'); return; }
    const choque = this.bloques().find((b, i) => i !== f.indice && b.dia === f.dia
      && ini < aMinutos(b.horaFin) && fin > aMinutos(b.horaInicio));
    if (choque) {
      this.errorForm.set(`Se cruza con ${choque.curso} (${choque.horaInicio} - ${choque.horaFin}) del ${this.dias[f.dia - 1].toLowerCase()}.`);
      return;
    }
    const bloque: BloqueHorario = {
      seccionCursoId: curso.id, curso: curso.nombre, color: curso.color, docente: curso.docenteNombre,
      estadoCurso: curso.estado, dia: f.dia, horaInicio: f.inicio, horaFin: f.fin,
    };
    this.bloques.update(l => f.indice === null ? [...l, bloque] : l.map((b, i) => i === f.indice ? bloque : b));
    this.sucio.set(true);
    this.form.set(null);
  }

  /** Elimina bloque. */
  eliminarBloque(): void {
    const f = this.form();
    if (!f || f.indice === null) return;
    this.bloques.update(l => l.filter((_, i) => i !== f.indice));
    this.sucio.set(true);
    this.form.set(null);
  }

  // ---------------- Guardar / volver ----------------

  guardar(): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    const datos = this.bloques().map(b => ({ seccionCursoId: b.seccionCursoId, dia: b.dia, horaInicio: b.horaInicio, horaFin: b.horaFin }));
    this.seccionService.guardarHorario(this.id, datos).subscribe({
      next: (h) => {
        this.guardando.set(false);
        this.bloques.set(h.bloques);
        this.sucio.set(false);
        this.toast.exito(`Horario guardado: ${h.bloques.length} bloque(s).`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo guardar el horario.');
      },
    });
  }

  /**
   * Vuelve a los datos de esta pantalla. Al terminar, lleva al usuario a otra página
   * (router.navigate). Antes pide confirmación al usuario.
   */
  async volver(): Promise<void> {
    if (this.sucio() && !await this.confirmar.pedir('Hay cambios sin guardar. ¿Salir de todas formas?')) return;
    this.sucio.set(false);
    // Abierto en una ventana nueva: se cierra. Si no, vuelve a la sección.
    if (window.opener) { window.close(); return; }
    this.router.navigate(['/home/admin/academico/grados-secciones', this.id], { queryParams: { pestana: 'horario' } });
  }

  /** Avisa salida. */
  @HostListener('window:beforeunload', ['$event'])
  avisarSalida(ev: BeforeUnloadEvent): void {
    if (this.sucio()) ev.preventDefault();
  }

  /** Se ejecuta al presionar la tecla Esc: cierra la ventana o el menú que esté abierto. */
  @HostListener('document:keydown.escape')
  escape(): void {
    this.form.set(null);
  }
}

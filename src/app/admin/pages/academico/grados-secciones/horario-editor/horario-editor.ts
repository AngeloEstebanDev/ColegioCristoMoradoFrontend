import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SeccionService } from '../../../../../core/services/seccion.service';
import { BloqueHorario, DIAS_SEMANA, Horario, aHora, aMinutos } from '../../../../../core/models/horario.model';
import { CursoSeccion, infoGrado } from '../../../../../core/models/seccion.model';
import { ConfirmService } from '../../../../../core/services/confirm.service';
import { ToastService } from '../../../../../core/services/toast.service';

interface Fila { inicio: number; fin: number; receso: boolean; }

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
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private seccionService = inject(SeccionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly dias = DIAS_SEMANA;
  readonly aHora = aHora;

  horario = signal<Horario | null>(null);
  cursos = signal<CursoSeccion[]>([]);
  bloques = signal<BloqueHorario[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  sucio = signal(false);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  form = signal<FormBloque | null>(null);
  errorForm = signal<string | null>(null);

  titulo = computed(() => infoGrado(this.horario()?.grado)?.titulo ?? this.horario()?.grado ?? '');

  /** Filas del cuadro: bloques de 15 min y una fila para el receso. */
  filas = computed<Fila[]>(() => {
    const h = this.horario();
    if (!h) return [];
    const paso = h.minutosBloque || 15;
    const ini = aMinutos(h.inicio), fin = aMinutos(h.fin);
    const rIni = aMinutos(h.recesoInicio), rFin = aMinutos(h.recesoFin);
    const filas: Fila[] = [];
    for (let t = ini; t < fin;) {
      if (t === rIni) { filas.push({ inicio: rIni, fin: rFin, receso: true }); t = rFin; continue; }
      filas.push({ inicio: t, fin: t + paso, receso: false });
      t += paso;
    }
    return filas;
  });

  /** grid-template-rows: cabecera + filas (el receso un poco más alto). */
  plantillaFilas = computed(() => ['40px', ...this.filas().map(f => f.receso ? '40px' : '30px')].join(' '));

  cursosActivos = computed(() => this.cursos().filter(c => c.estado === 'Activo'));

  /** Horas de inicio posibles (sin el receso). */
  opcionesInicio = computed(() => this.filas().filter(f => !f.receso).map(f => aHora(f.inicio)));

  /** Horas de fin posibles para el inicio elegido: hasta el receso o el fin del turno. */
  opcionesFin = computed(() => {
    const f = this.form();
    if (!f) return [];
    const ini = aMinutos(f.inicio);
    const res: string[] = [];
    for (const fila of this.filas()) {
      if (fila.inicio < ini) continue;
      if (fila.receso) break;
      res.push(aHora(fila.fin));
    }
    return res;
  });

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

  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  // ---------------- Cuadro ----------------

  /** Fila (en el grid) donde empieza / termina una hora. La fila 1 es la cabecera. */
  filaDe(hora: string): number {
    const m = aMinutos(hora);
    const i = this.filas().findIndex(f => f.inicio === m);
    return (i < 0 ? this.filas().length : i) + 2;
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

  ocupado(dia: number, inicio: number): boolean {
    return this.bloques().some(b => b.dia === dia && aMinutos(b.horaInicio) <= inicio && inicio < aMinutos(b.horaFin));
  }

  // ---------------- Ventana "Editar bloque" ----------------

  nuevoBloque(dia: number, fila: Fila): void {
    if (fila.receso || this.ocupado(dia, fila.inicio)) return;
    if (!this.cursosActivos().length) {
      this.error.set('Esta sección no tiene cursos activos. Agrégalos en la pestaña "Cursos" de la sección.');
      return;
    }
    // Fin sugerido: 45 min, sin pasar el recreo, el fin del turno ni el siguiente bloque.
    const ini = fila.inicio;
    let fin = ini;
    for (const f of this.filas()) {
      if (f.inicio < ini) continue;
      if (f.receso || this.ocupado(dia, f.inicio) || f.fin - ini > 45) break;
      fin = f.fin;
    }
    this.errorForm.set(null);
    this.form.set({ indice: null, seccionCursoId: null, dia, inicio: aHora(ini), fin: aHora(fin) });
  }

  editarBloque(i: number): void {
    const b = this.bloques()[i];
    this.errorForm.set(null);
    this.form.set({ indice: i, seccionCursoId: b.seccionCursoId, dia: b.dia, inicio: b.horaInicio, fin: b.horaFin });
  }

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

  cerrarForm(): void {
    this.form.set(null);
  }

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

  async volver(): Promise<void> {
    if (this.sucio() && !await this.confirmar.pedir('Hay cambios sin guardar. ¿Salir de todas formas?')) return;
    this.sucio.set(false);
    // Abierto en una ventana nueva: se cierra. Si no, vuelve a la sección.
    if (window.opener) { window.close(); return; }
    this.router.navigate(['/home/admin/academico/grados-secciones', this.id], { queryParams: { pestana: 'horario' } });
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarSalida(ev: BeforeUnloadEvent): void {
    if (this.sucio()) ev.preventDefault();
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    this.form.set(null);
  }
}

import { Component, HostListener, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotaService } from '../../../../core/services/nota.service';
import { CursoAula } from '../../../../core/models/aula.model';
import { EvaluacionNota, Participacion, ParticipacionAlumno, RegistroNotas, colorNota } from '../../../../core/models/nota.model';
import { Periodo, ROMANOS } from '../../../../core/models/periodo.model';
import { hoyIso, num } from '../../../../core/utils/texto';
import { dmy } from '../../../alumno/pages/cursos/curso-detalle';
import { AvatarPersona, ChipVisible, EstiloItem, IconoItem } from './curso-ui';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

/** Modelo Bloque: describe la forma de los datos de «bloque». */
interface Bloque { periodo: Periodo; registro: RegistroNotas | null; participacion: Participacion | null; }

/** Constante COLORES: valor fijo (colores) que se reutiliza en varias partes. */
const COLORES: { color: string; fondo: string }[] = [
  { color: '#DC2626', fondo: '#FDE8E8' },
  { color: '#2563EB', fondo: '#E6EEFB' },
  { color: '#EA580C', fondo: '#FDEBDD' },
  { color: '#0D9488', fondo: '#DDF3F1' },
];

/**
 * Docente > curso > Exámenes.
 * Por bimestre: "Participación" (promedio automático de las tareas y cuestionarios, desde la primera
 * actividad) y los exámenes presenciales que el docente agrega (Examen mensual, bimestral, Comportamiento...).
 */
@Component({
  selector: 'app-examenes-curso',
  standalone: true,
  imports: [CommonModule, FormsModule, IconoItem, AvatarPersona, ChipVisible],
  templateUrl: './examenes-curso.html',
})
export class ExamenesCurso implements OnInit {
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);
  /** Servicio NotaService (inyectado por Angular). */
  private notas = inject(NotaService);

  @Input({ required: true }) curso!: CursoAula;
  @Input() periodos: Periodo[] = [];

  readonly dmy = dmy;
  readonly num = num;
  readonly colorNota = colorNota;
  readonly romanos = ROMANOS;
  readonly estiloParticipacion: EstiloItem = { etiqueta: 'Participación', color: '#7C3AED', fondo: '#F0EAFD', icono: 'examen' };

  /** Estado (signal): bloques. */
  bloques = signal<Bloque[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): éxito. */
  exito = signal<string | null>(null);
  /** Estado (signal): cerrados. */
  cerrados = signal<Set<number>>(new Set());
  /** Estado (signal): menú. */
  menu = signal<number | null>(null);

  /** Vista abierta: participación de un bimestre o un examen. */
  vistaParticipacion = signal<Bloque | null>(null);
  /** Estado (signal): alumno participación. */
  alumnoParticipacion = signal<number | null>(null);
  /** Estado (signal): vista examen. */
  vistaExamen = signal<{ bloque: Bloque; evaluacion: EvaluacionNota } | null>(null);
  /** Estado (signal): valores. */
  valores = signal<Record<number, string>>({});
  /** Estado (signal): guardando. */
  guardando = signal(false);

  /** Estado (signal): modal. */
  modal = signal<{ id: number | null; nombre: string; periodoId: number | null } | null>(null);
  /** Estado (signal): error modal. */
  errorModal = signal<string | null>(null);
  /** Estado (signal): guardando modal. */
  guardandoModal = signal(false);

  /** Valor calculado (computed): periodo activo. Se actualiza solo. */
  periodoActivo = computed(() => this.periodos.find(p => p.activo) ?? null);
  detalleAlumno = computed<ParticipacionAlumno | null>(() =>
    this.vistaParticipacion()?.participacion?.alumnos.find(a => a.estudianteId === this.alumnoParticipacion()) ?? null);

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void { this.cargar(); }

  /** Cierra menú. */
  @HostListener('document:click')
  cerrarMenu(): void { this.menu.set(null); }

  /** Carga los datos de esta pantalla. */
  cargar(): void {
    const anio = new Date().getFullYear();
    const pers = this.periodos.filter(p => p.anio === anio).sort((a, b) => a.bimestre - b.bimestre);
    if (!pers.length) { this.cargando.set(false); this.bloques.set([]); return; }
    this.cargando.set(true);
    const id = this.curso.seccionCursoId;
    forkJoin(pers.map(p => forkJoin({
      registro: this.notas.registro(id, p.id).pipe(catchError(() => of(null))),
      participacion: this.notas.participacion(id, p.id).pipe(catchError(() => of(null))),
    }))).subscribe({
      next: (r) => {
        this.bloques.set(pers.map((p, i) => ({ periodo: p, registro: r[i].registro, participacion: r[i].participacion })));
        this.cargando.set(false);
        // Bimestres sin nada y que no son el actual, cerrados al inicio.
        const c = new Set<number>();
        this.bloques().forEach(b => { if (!b.periodo.activo && !this.tieneAlgo(b)) c.add(b.periodo.id); });
        this.cerrados.set(c);
        this.refrescarVistas();
      },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar los exámenes.'); },
    });
  }

  /** Realiza la acción «refrescar vistas» de esta pantalla. */
  private refrescarVistas(): void {
    const vp = this.vistaParticipacion();
    if (vp) this.vistaParticipacion.set(this.bloques().find(b => b.periodo.id === vp.periodo.id) ?? null);
    const ve = this.vistaExamen();
    if (ve) {
      const b = this.bloques().find(x => x.periodo.id === ve.bloque.periodo.id);
      const ev = b?.registro?.evaluaciones.find(e => e.id === ve.evaluacion.id);
      this.vistaExamen.set(b && ev ? { bloque: b, evaluacion: ev } : null);
    }
  }

  /** Indica si tiene algo (devuelve verdadero o falso). */
  tieneAlgo(b: Bloque): boolean {
    return (b.participacion?.actividades ?? 0) > 0 || (b.registro?.evaluaciones.length ?? 0) > 0;
  }

  /** Devuelve el nombre de los datos de esta pantalla. */
  nombre(p: Periodo): string { return `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}`; }

  /** Muestra u oculta los datos de esta pantalla. */
  alternar(id: number): void {
    this.cerrados.update(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  /** Devuelve el estilo de examen. */
  estiloExamen(i: number): EstiloItem {
    const c = COLORES[i % COLORES.length];
    return { etiqueta: 'Evaluación', color: c.color, fondo: c.fondo, icono: 'examen' };
  }

  /** Muestra u oculta menú. */
  alternarMenu(id: number, ev: Event): void {
    ev.stopPropagation();
    this.menu.update(m => m === id ? null : id);
  }

  /** Devuelve «pastilla». */
  pastilla(v: number | null | undefined): { texto: string; color: string; fondo: string } {
    if (v === null || v === undefined) return { texto: '—', color: '#6B5A67', fondo: '#F0E6D8' };
    return { texto: `${Math.round(v + 1e-9)}/20`, ...colorNota(v) };
  }

  // ---------------- Participación ----------------

  abrirParticipacion(b: Bloque): void {
    this.vistaParticipacion.set(b);
    this.alumnoParticipacion.set(b.participacion?.alumnos[0]?.estudianteId ?? null);
  }

  /** Devuelve la etiqueta de tipo. */
  etiquetaTipo(tipo: string): string { return tipo === 'CUESTIONARIO' ? 'Cuestionario' : 'Archivo/Tarea'; }

  /** Devuelve «nota detalle». */
  notaDetalle(d: { nota: number | null; estado: string }): { texto: string; color: string; fondo: string } {
    switch (d.estado) {
      case 'CALIFICADA': return this.pastilla(d.nota);
      case 'NO_ENTREGADA': return { texto: '0/20', color: '#A62639', fondo: '#FBE7E9' };
      case 'POR_CALIFICAR': return { texto: 'Por calificar', color: '#1D4ED8', fondo: '#E6EEFB' };
      default: return { texto: 'Pendiente', color: '#9A6B00', fondo: '#FDF1DC' };
    }
  }

  // ---------------- Examen ----------------

  abrirExamen(b: Bloque, ev: EvaluacionNota): void {
    this.vistaExamen.set({ bloque: b, evaluacion: ev });
    const v: Record<number, string> = {};
    (b.registro?.alumnos ?? []).forEach(a => {
      const n = a.notas[String(ev.id)];
      v[a.estudianteId] = n === undefined || n === null ? '' : String(n);
    });
    this.valores.set(v);
    this.exito.set(null);
    this.error.set(null);
  }

  /** Cambia valor. */
  cambiarValor(id: number, valor: string): void { this.valores.update(v => ({ ...v, [id]: valor })); }

  /**
   * Guarda notas. Pide los datos al backend con notas.guardarNotas() y actualiza la pantalla cuando
   * llega la respuesta. Muestra un aviso (toast) con el resultado.
   */
  guardarNotas(): void {
    const ve = this.vistaExamen();
    if (!ve) return;
    const cambios = [];
    for (const a of ve.bloque.registro?.alumnos ?? []) {
      const texto = (this.valores()[a.estudianteId] ?? '').trim();
      const anterior = a.notas[String(ve.evaluacion.id)];
      const valor = texto === '' ? null : Number(texto.replace(',', '.'));
      if (valor !== null && (isNaN(valor) || valor < 0 || valor > 20)) {
        this.error.set(`La nota de ${a.nombre} debe estar entre 0 y 20.`);
        return;
      }
      if ((anterior ?? null) !== valor) cambios.push({ evaluacionId: ve.evaluacion.id, estudianteId: a.estudianteId, valor, comentario: a.comentarios[String(ve.evaluacion.id)] ?? null });
    }
    if (!cambios.length) { this.toast.info('No hay cambios por guardar.'); return; }
    this.guardando.set(true);
    this.error.set(null);
    this.notas.guardarNotas(this.curso.seccionCursoId, cambios, null).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.bloques.update(l => l.map(b => b.periodo.id === ve.bloque.periodo.id ? { ...b, registro: r } : b));
        this.refrescarVistas();
        this.toast.exito('Notas guardadas.');
      },
      error: (e) => { this.guardando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron guardar las notas.'); },
    });
  }

  // ---------------- Crear / editar / eliminar ----------------

  nuevo(): void {
    if (!this.periodoActivo()) { this.error.set('No hay un bimestre activo. Pide a la administración que active el bimestre actual.'); return; }
    this.errorModal.set(null);
    this.modal.set({ id: null, nombre: '', periodoId: this.periodoActivo()!.id });
  }

  /** Edita los datos de esta pantalla. */
  editar(ev: EvaluacionNota, b: Bloque): void {
    this.menu.set(null);
    this.errorModal.set(null);
    this.modal.set({ id: ev.id, nombre: ev.nombre, periodoId: b.periodo.id });
  }

  /** Guarda modal. */
  guardarModal(): void {
    const m = this.modal();
    if (!m) return;
    const nombre = m.nombre.trim();
    if (!nombre) { this.errorModal.set('Escribe el nombre del examen.'); return; }
    const anterior = m.id ? this.bloques().flatMap(b => b.registro?.evaluaciones ?? []).find(e => e.id === m.id) : null;
    const datos = { periodoId: m.periodoId, nombre, tipo: anterior?.tipo ?? 'EXAMEN', peso: anterior?.peso ?? 1, fecha: anterior?.fecha ?? hoyIso() };
    this.guardandoModal.set(true);
    const op = m.id ? this.notas.actualizarEvaluacion(m.id, datos) : this.notas.crearEvaluacion(this.curso.seccionCursoId, datos);
    op.subscribe({
      next: (r) => {
        this.guardandoModal.set(false);
        this.modal.set(null);
        this.bloques.update(l => l.map(b => b.periodo.id === r.periodo?.id ? { ...b, registro: r } : b));
        this.cerrados.update(s => { const n = new Set(s); if (r.periodo) n.delete(r.periodo.id); return n; });
        this.refrescarVistas();
      },
      error: (e) => { this.guardandoModal.set(false); this.errorModal.set(e?.error?.mensaje ?? 'No se pudo guardar el examen.'); },
    });
  }

  /**
   * Elimina los datos de esta pantalla. Pide los datos al backend con notas.eliminarEvaluacion() y
   * actualiza la pantalla cuando llega la respuesta. Antes pide confirmación al usuario.
   */
  async eliminar(ev: EvaluacionNota): Promise<void> {
    this.menu.set(null);
    if (!await this.confirmar.pedir(`¿Eliminar "${ev.nombre}"? Se borrarán sus ${ev.notasRegistradas} nota(s) registradas.`)) return;
    this.notas.eliminarEvaluacion(ev.id).subscribe({
      next: (r) => {
        this.bloques.update(l => l.map(b => b.periodo.id === r.periodo?.id ? { ...b, registro: r } : b));
        if (this.vistaExamen()?.evaluacion.id === ev.id) this.vistaExamen.set(null);
      },
      error: (e) => this.error.set(e?.error?.mensaje ?? 'No se pudo eliminar el examen.'),
    });
  }

  /** Vuelve a los datos de esta pantalla. */
  volver(): void {
    this.vistaParticipacion.set(null);
    this.vistaExamen.set(null);
    this.exito.set(null);
    this.error.set(null);
  }
}

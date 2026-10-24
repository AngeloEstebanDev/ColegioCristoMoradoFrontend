import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SeccionService } from '../../../../../core/services/seccion.service';
import { EstudianteService } from '../../../../../core/services/estudiante.service';
import { DocenteService } from '../../../../../core/services/docente.service';
import { CursoCatalogo, CursoSeccion, Seccion, horarioDe, infoGrado, recreoDe, turnoDe } from '../../../../../core/models/seccion.model';
import { Estudiante } from '../../../../../core/models/estudiante.model';
import { Docente } from '../../../../../core/models/docente.model';
import { CATEGORIAS_CURSO } from '../../../../../core/models/curso.model';
import { iniciales } from '../../../../../core/utils/texto';
import { ConfirmService } from '../../../../../core/services/confirm.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { FotoUsuario } from '../../../../../shared/components/foto-usuario/foto-usuario';

type Pestana = 'alumnos' | 'cursos' | 'horario';
type Panel = 'matricular' | 'curso' | 'docente' | 'tutor' | 'editar' | 'descripcion' | null;

/** Detalle de una sección: Alumnos, Cursos y Horario. */
@Component({
  selector: 'app-seccion-detalle',
  standalone: true,
  imports: [FotoUsuario, CommonModule, FormsModule],
  templateUrl: './seccion-detalle.html',
})
export class SeccionDetalle implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private seccionService = inject(SeccionService);
  private estudianteService = inject(EstudianteService);
  private docenteService = inject(DocenteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly iniciales = iniciales;
  readonly horarioDe = horarioDe;
  readonly turnoDe = turnoDe;
  readonly recreoDe = recreoDe;
  readonly anio = new Date().getFullYear();

  seccion = signal<Seccion | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);
  pestana = signal<Pestana>('alumnos');
  busqueda = signal('');
  menuCurso = signal<number | null>(null);

  // Datos para los paneles
  estudiantes = signal<Estudiante[]>([]);
  docentes = signal<Docente[]>([]);
  catalogo = signal<CursoCatalogo[]>([]);
  /** Todas las secciones: para saber qué docentes ya son tutores (1 sección por docente). */
  todasSecciones = signal<Seccion[]>([]);

  // Formulario "Agregar curso"
  cursoNuevo = signal<number | null>(null);
  descripcionNueva = signal('');
  docenteNuevo = signal<number | null>(null);

  panel = signal<Panel>(null);
  cursoSel = signal<CursoSeccion | null>(null);   // para "Asignar docente"
  buscarPanel = signal('');
  descripcionEd = signal('');
  capacidadEd = signal(35);
  procesando = signal(false);
  errorPanel = signal<string | null>(null);

  titulo = computed(() => infoGrado(this.seccion()?.grado)?.titulo ?? this.seccion()?.grado ?? '');
  libres = computed(() => {
    const s = this.seccion();
    return s ? Math.max(0, s.capacidad - s.totalAlumnos) : 0;
  });
  ocupacion = computed(() => {
    const s = this.seccion();
    return s && s.capacidad ? Math.min(100, Math.round(s.totalAlumnos / s.capacidad * 100)) : 0;
  });

  alumnosFiltrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    return (this.seccion()?.alumnos ?? []).filter(a => !t
      || a.nombreCompleto.toLowerCase().includes(t)
      || (a.usuario ?? '').toLowerCase().includes(t)
      || a.dni.toLowerCase().includes(t));
  });

  /** Alumnos que se pueden matricular (los que no están en esta sección). */
  candidatos = computed(() => {
    const s = this.seccion();
    const t = this.buscarPanel().toLowerCase().trim();
    return this.estudiantes()
      .filter(e => !(s && e.grado === s.grado && e.seccion === s.letra))
      .filter(e => !t || e.nombreCompleto.toLowerCase().includes(t) || e.dni.toLowerCase().includes(t)
        || (e.usuario ?? '').toLowerCase().includes(t))
      .sort((a, b) => Number(!!a.grado) - Number(!!b.grado) || a.nombreCompleto.localeCompare(b.nombreCompleto));
  });

  cursosDisponibles = computed(() => {
    const usados = new Set((this.seccion()?.cursos ?? []).map(c => c.cursoId));
    return this.catalogo().filter(c => !usados.has(c.id));
  });

  /** Cursos disponibles agrupados por categoría (para el combo "Curso"). */
  cursosPorCategoria = computed(() => {
    const disp = this.cursosDisponibles();
    return CATEGORIAS_CURSO
      .map(cat => ({ nombre: cat.nombre, cursos: disp.filter(c => c.categoria === cat.clave) }))
      .filter(g => g.cursos.length);
  });

  docentesFiltrados = computed(() => {
    const t = this.buscarPanel().toLowerCase().trim();
    return this.docentes()
      .filter(d => d.estado !== 'Inactivo')
      .filter(d => !t || d.nombreCompleto.toLowerCase().includes(t) || (d.especialidad ?? '').toLowerCase().includes(t));
  });

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap.get('pestana');
    if (p === 'alumnos' || p === 'cursos' || p === 'horario') this.pestana.set(p);
    this.cargar();
  }

  /** Abre el editor de horario en una ventana (pestaña) nueva. */
  abrirEditorHorario(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/home/admin/academico/grados-secciones', this.id, 'horario']));
    const w = window.open(url, '_blank');
    if (!w) this.router.navigateByUrl(url);   // si el navegador bloquea la ventana, se abre aquí
  }

  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  cargar(): void {
    this.cargando.set(true);
    this.seccionService.obtener(this.id).subscribe({
      next: (s) => { this.seccion.set(s); this.cargando.set(false); },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.status === 404 ? 'La sección no existe.' : 'No se pudo conectar con el servidor.');
      },
    });
  }

  volver(): void {
    const s = this.seccion();
    this.router.navigate(['/home/admin/academico/grados-secciones'], { queryParams: s ? { grado: s.grado } : {} });
  }

  /** "Juan Pérez García" -> "Pérez" (como en la lista de cursos). */
  apellido(nombre: string | null): string {
    const p = (nombre ?? '').trim().split(/\s+/);
    return p.length >= 3 ? p[p.length - 2] : p[p.length - 1] ?? '';
  }

  textoMatricula(e: Estudiante): string {
    return e.grado ? `Ahora en ${e.grado} "${e.seccion}" (se moverá aquí)` : 'Sin matrícula';
  }

  private actualizar(s: Seccion, mensaje: string): void {
    this.seccion.set(s);
    this.toast.exito(mensaje);
    this.error.set(null);
  }

  private fallo(err: any, porDefecto: string): void {
    this.procesando.set(false);
    const msg = err?.error?.mensaje ?? porDefecto;
    if (this.panel()) this.errorPanel.set(msg); else this.error.set(msg);
  }

  // ---------------- Paneles ----------------

  abrirPanel(p: Exclude<Panel, null>, curso: CursoSeccion | null = null): void {
    this.menuCurso.set(null);
    this.cursoSel.set(curso);
    this.buscarPanel.set('');
    this.errorPanel.set(null);
    this.procesando.set(false);
    if (p === 'matricular') this.estudianteService.listar().subscribe({ next: e => this.estudiantes.set(e) });
    if (p === 'curso') {
      this.cursoNuevo.set(null);
      this.descripcionNueva.set('');
      this.docenteNuevo.set(null);
      this.seccionService.catalogoCursos().subscribe({ next: c => this.catalogo.set(c) });
    }
    if ((p === 'docente' || p === 'tutor' || p === 'curso') && !this.docentes().length) this.docenteService.listar().subscribe({ next: d => this.docentes.set(d) });
    if (p === 'tutor') this.seccionService.listar().subscribe({ next: l => this.todasSecciones.set(l) });
    if (p === 'descripcion') this.descripcionEd.set(curso?.descripcion ?? '');
    if (p === 'editar') {
      this.capacidadEd.set(this.seccion()?.capacidad ?? 35);
    }
    this.panel.set(p);
  }

  cerrarPanel(): void {
    this.panel.set(null);
  }

  // ---------------- Alumnos ----------------

  matricular(e: Estudiante): void {
    const s = this.seccion();
    if (!s || this.procesando()) return;
    this.procesando.set(true);
    this.errorPanel.set(null);
    this.seccionService.matricular(s.id, e.id).subscribe({
      next: (act) => {
        this.procesando.set(false);
        this.actualizar(act, `${e.nombreCompleto} quedó matriculado en la sección ${act.letra}.`);
        // Se queda abierto para seguir matriculando
        this.estudiantes.update(l => l.map(x => x.id === e.id ? { ...x, grado: act.grado, seccion: act.letra } : x));
        if (act.totalAlumnos >= act.capacidad) this.cerrarPanel();
      },
      error: (err) => this.fallo(err, 'No se pudo matricular al alumno.'),
    });
  }

  async retirar(a: { id: number; nombreCompleto: string }): Promise<void> {
    const s = this.seccion();
    if (!s || !await this.confirmar.pedir(`¿Retirar a ${a.nombreCompleto} de la sección ${s.letra}? Quedará sin matrícula.`)) return;
    this.seccionService.retirar(s.id, a.id).subscribe({
      next: (act) => this.actualizar(act, `${a.nombreCompleto} fue retirado de la sección.`),
      error: (err) => this.fallo(err, 'No se pudo retirar al alumno.'),
    });
  }

  // ---------------- Cursos ----------------

  alternarMenu(c: CursoSeccion, ev: Event): void {
    ev.stopPropagation();
    this.menuCurso.set(this.menuCurso() === c.id ? null : c.id);
  }

  /** "Juan Pérez" es tutor de otra sección -> texto para deshabilitarlo; null si está libre. */
  tutorDeOtra(d: Docente): string | null {
    const s = this.seccion();
    const otra = this.todasSecciones().find(x => x.tutorId === d.id && x.id !== s?.id);
    return otra ? `Tutor(a) de ${otra.grado} - Sección ${otra.letra}` : null;
  }

  agregarCurso(): void {
    const s = this.seccion();
    const c = this.catalogo().find(x => x.id === this.cursoNuevo());
    if (!s || this.procesando()) return;
    if (!c) { this.errorPanel.set('Selecciona el curso.'); return; }
    if (this.descripcionNueva().length > 300) { this.errorPanel.set('La descripción admite hasta 300 caracteres.'); return; }
    this.procesando.set(true);
    this.errorPanel.set(null);
    this.seccionService.agregarCurso(s.id, c.id, this.docenteNuevo(), this.descripcionNueva().trim() || null).subscribe({
      next: (act) => {
        this.procesando.set(false);
        this.cerrarPanel();
        this.pestana.set('cursos');
        this.actualizar(act, `Se agregó ${c.nombre} a la sección.`);
      },
      error: (err) => this.fallo(err, 'No se pudo agregar el curso.'),
    });
  }

  elegirDocente(d: Docente | null): void {
    const s = this.seccion();
    if (!s || this.procesando()) return;
    this.procesando.set(true);
    const tutor = this.panel() === 'tutor';
    const curso = this.cursoSel();
    const peticion = tutor
      ? this.seccionService.cambiarTutor(s.id, d?.id ?? null)
      : this.seccionService.asignarDocente(s.id, curso!.id, d?.id ?? null);
    peticion.subscribe({
      next: (act) => {
        this.procesando.set(false);
        this.cerrarPanel();
        this.actualizar(act, tutor
          ? (d ? `${d.nombreCompleto} es ahora tutor(a) de la sección.` : 'La sección quedó sin tutor.')
          : (d ? `${d.nombreCompleto} dictará ${curso!.nombre}.` : `${curso!.nombre} quedó sin docente.`));
      },
      error: (err) => this.fallo(err, 'No se pudo guardar el cambio.'),
    });
  }

  async alternarCurso(c: CursoSeccion): Promise<void> {
    this.menuCurso.set(null);
    const s = this.seccion();
    if (!s) return;
    const activar = c.estado === 'Inactivo';
    if (!activar && !await this.confirmar.pedir(`¿Desactivar ${c.nombre} en esta sección?`)) return;
    this.seccionService.cambiarEstadoCurso(s.id, c.id, activar).subscribe({
      next: (act) => this.actualizar(act, `${c.nombre} ${activar ? 'se activó' : 'se desactivó'} en la sección.`),
      error: (err) => this.fallo(err, 'No se pudo cambiar el estado del curso.'),
    });
  }

  guardarDescripcion(): void {
    const s = this.seccion();
    const c = this.cursoSel();
    if (!s || !c || this.procesando()) return;
    if (this.descripcionEd().length > 300) { this.errorPanel.set('La descripción admite hasta 300 caracteres.'); return; }
    this.procesando.set(true);
    this.errorPanel.set(null);
    this.seccionService.editarDescripcion(s.id, c.id, this.descripcionEd().trim() || null).subscribe({
      next: (act) => { this.procesando.set(false); this.cerrarPanel(); this.actualizar(act, `Se actualizó la descripción de ${c.nombre}.`); },
      error: (err) => this.fallo(err, 'No se pudo guardar la descripción.'),
    });
  }

  // ---------------- Editar sección ----------------

  guardarEdicion(): void {
    const s = this.seccion();
    if (!s) return;
    const cap = Number(this.capacidadEd());
    if (!cap || !Number.isInteger(cap) || cap < 1 || cap > 60) { this.errorPanel.set('La capacidad debe estar entre 1 y 60.'); return; }
    this.procesando.set(true);
    this.seccionService.actualizar(s.id, { turno: s.turno, capacidad: cap }).subscribe({
      next: (act) => { this.procesando.set(false); this.cerrarPanel(); this.actualizar(act, 'Se actualizaron los datos de la sección.'); },
      error: (err) => this.fallo(err, 'No se pudo guardar la sección.'),
    });
  }

  @HostListener('document:click')
  cerrarMenu(): void {
    this.menuCurso.set(null);
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.menuCurso() !== null) { this.menuCurso.set(null); return; }
    this.cerrarPanel();
  }
}

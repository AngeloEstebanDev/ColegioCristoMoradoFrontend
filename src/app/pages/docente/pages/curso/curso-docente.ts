import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AulaService } from '../../../../core/services/aula.service';
import { PeriodoService } from '../../../../core/services/periodo.service';
import { ArchivoService, extension, tamanioLegible } from '../../../../core/services/archivo.service';
import { Actividad, Carpeta, CursoAula, Material, Participantes } from '../../../../core/models/aula.model';
import { Periodo, ROMANOS } from '../../../../core/models/periodo.model';
import { categoriaDe } from '../../../../core/models/curso.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { num } from '../../../../core/utils/texto';
import { IconoCategoria } from '../../../../shared/components/icono-categoria/icono-categoria';
import { dmy, dmyHora } from '../../../alumno/pages/cursos/curso-detalle';
import { AvatarPersona, ChipVisible, EstiloItem, IconoItem, aIso, estiloActividad, estiloMaterial } from './curso-ui';
import { ContenidoForm, TipoContenido } from './contenido-form';
import { VistaPrevia } from '../../../../shared/components/vista-previa/vista-previa';
import { EntregasActividad } from './entregas-actividad';
import { AsistenciaCurso } from './asistencia-curso';
import { ExamenesCurso } from './examenes-curso';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

type Pestana = 'contenido' | 'actividades' | 'asistencia' | 'examenes';

/** Material o actividad dentro de una carpeta. */
interface Item { clave: string; fecha: string; material?: Material; actividad?: Actividad; }

interface CarpetaVista { carpeta: Carpeta | null; clave: string; nombre: string; items: Item[]; }

interface Bimestre { clave: string; periodo: Periodo | null; nombre: string; desde: string | null; hasta: string | null; carpetas: CarpetaVista[]; }

interface Formulario {
  carpetaId: number | null;
  carpetaNombre: string;
  material: Material | null;
  actividad: Actividad | null;
  tipo: TipoContenido;
}

/**
 * Docente > Mis Cursos > un curso.
 * Contenido: carpetas por bimestre (las nuevas se crean en el bimestre actual) con textos, archivos,
 * actividades y cuestionarios; cada elemento se puede ocultar, editar o eliminar.
 * Actividades: entregas y calificación. Asistencia: solo durante la hora de clase.
 * Exámenes: Participación (automática) y los exámenes presenciales que registre el docente.
 */
@Component({
  selector: 'app-curso-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconoCategoria, IconoItem, AvatarPersona, ChipVisible,
    ContenidoForm, EntregasActividad, AsistenciaCurso, ExamenesCurso, VistaPrevia],
  templateUrl: './curso-docente.html',
})
export class CursoDocente implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);
  private aula = inject(AulaService);
  private periodoService = inject(PeriodoService);
  private archivos = inject(ArchivoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly dmy = dmy;
  readonly dmyHora = dmyHora;
  readonly num = num;
  readonly tam = tamanioLegible;
  readonly extension = extension;
  readonly estiloMaterial = estiloMaterial;
  readonly estiloActividad = estiloActividad;
  readonly anio = new Date().getFullYear();

  readonly pestanas: { id: Pestana; nombre: string; icono: string }[] = [
    { id: 'contenido', nombre: 'Contenido', icono: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z' },
    { id: 'actividades', nombre: 'Actividades', icono: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2ZM9 13l2 2 4-4' },
    { id: 'asistencia', nombre: 'Asistencia', icono: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 10h18M8 3v4M16 3v4M9 15l2 2 4-4' },
    { id: 'examenes', nombre: 'Exámenes', icono: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h4' },
  ];

  id = 0;
  pestana = signal<Pestana>('contenido');
  curso = signal<CursoAula | null>(null);
  materiales = signal<Material[]>([]);
  actividades = signal<Actividad[]>([]);
  carpetas = signal<Carpeta[]>([]);
  participantes = signal<Participantes | null>(null);
  periodos = signal<Periodo[]>([]);
  periodosListos = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  abiertas = signal<Set<string>>(new Set());
  verEstructura = signal(true);
  verProfesor = signal(true);
  verParticipantes = signal(true);
  /** Menú ⋮ abierto (clave del elemento). */
  menu = signal<string | null>(null);

  formulario = signal<Formulario | null>(null);
  carpetaModal = signal<{ id: number | null; nombre: string } | null>(null);
  guardandoCarpeta = signal(false);
  errorCarpeta = signal<string | null>(null);
  /** Actividad abierta en la pestaña Actividades (entregas y calificación). */
  actividadDetalle = signal<Actividad | null>(null);

  // Panel de un material
  material = signal<Material | null>(null);

  categoria = computed(() => categoriaDe(this.curso()?.categoria));
  salon = computed(() => {
    const c = this.curso();
    return c ? `${infoGrado(c.grado)?.titulo ?? c.grado} “${c.letra}”` : '';
  });
  nivel = computed(() => (this.curso()?.grado ?? '').includes('Secundaria') ? 'Secundaria' : 'Primaria');
  periodoActivo = computed(() => this.periodos().find(p => p.activo) ?? null);

  /** Bimestres del año (más los que tengan carpetas de otros años), cada uno con sus carpetas. */
  bimestres = computed<Bimestre[]>(() => this.agrupar(false));
  bimestresActividades = computed<Bimestre[]>(() => this.agrupar(true));

  /** La fecha límite ya pasó (se muestra en rojo). */
  vencio(fecha: string | null | undefined): boolean {
    return !!fecha && new Date(fecha).getTime() <= Date.now();
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const tab = this.route.snapshot.queryParamMap.get('tab') as Pestana | null;
    if (tab && this.pestanas.some(p => p.id === tab)) this.pestana.set(tab);

    this.aula.curso(this.id).subscribe({
      next: (c) => this.curso.set(c),
      error: (e) => this.error.set(e?.error?.mensaje ?? 'No se pudo abrir el curso.'),
    });
    this.aula.participantes(this.id).subscribe({ next: (p) => this.participantes.set(p), error: () => {} });
    this.periodoService.listar().subscribe({
      next: (p) => { this.periodos.set(p); this.periodosListos.set(true); this.abrirPorDefecto(); },
      error: () => this.periodosListos.set(true),
    });
    this.recargar(true);
  }

  /** Vuelve a pedir carpetas, materiales y actividades. */
  recargar(primeraVez = false): void {
    let pendientes = 3;
    const fin = () => {
      if (--pendientes > 0) return;
      this.cargando.set(false);
      if (primeraVez) this.abrirPorDefecto();
      const abierta = this.actividadDetalle();
      if (abierta) this.actividadDetalle.set(this.actividades().find(a => a.id === abierta.id) ?? null);
    };
    this.aula.carpetas(this.id).subscribe({ next: (c) => { this.carpetas.set(c); fin(); }, error: () => fin() });
    this.aula.materiales(this.id).subscribe({ next: (m) => { this.materiales.set(m); fin(); }, error: () => fin() });
    this.aula.actividades(this.id).subscribe({ next: (a) => { this.actividades.set(a); fin(); }, error: () => fin() });
  }

  cambiarPestana(p: Pestana): void {
    this.pestana.set(p);
    this.actividadDetalle.set(null);
    this.menu.set(null);
    this.router.navigate([], { queryParams: { tab: p === 'contenido' ? null : p }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  // ---------------- Agrupar ----------------

  private agrupar(soloActividades: boolean): Bimestre[] {
    const periodos = this.periodos();
    const carpetas = this.carpetas();
    const delAnio = periodos.filter(p => p.anio === this.anio || carpetas.some(c => c.periodoId === p.id))
      .sort((a, b) => a.anio - b.anio || a.bimestre - b.bimestre);
    const items: Item[] = [
      ...(soloActividades ? [] : this.materiales().map(m => ({ clave: 'm' + m.id, fecha: m.fechaPublicacion, material: m }))),
      ...this.actividades().map(a => ({ clave: 'a' + a.id, fecha: soloActividades ? a.fechaLimite : a.fechaPublicacion, actividad: a })),
    ].sort((x, y) => x.fecha.localeCompare(y.fecha));
    const carpetaDe = (i: Item) => (i.material ? i.material.carpetaId : i.actividad!.carpetaId) ?? null;
    const usados = new Set<string>();
    const lista: Bimestre[] = [];
    for (const p of delAnio) {
      const vistas: CarpetaVista[] = carpetas.filter(c => c.periodoId === p.id).map(c => {
        const suyos = items.filter(i => carpetaDe(i) === c.id);
        suyos.forEach(i => usados.add(i.clave));
        return { carpeta: c, clave: 'f' + c.id, nombre: c.nombre, items: suyos };
      });
      // Contenido anterior a las carpetas (sin carpeta): se ubica por su fecha.
      const sueltos = items.filter(i => !usados.has(i.clave) && !carpetas.some(c => c.id === carpetaDe(i))
        && i.fecha.substring(0, 10) >= p.fechaInicio && i.fecha.substring(0, 10) <= p.fechaFin);
      sueltos.forEach(i => usados.add(i.clave));
      if (sueltos.length) vistas.push({ carpeta: null, clave: 'sin' + p.id, nombre: 'Contenido sin carpeta', items: sueltos });
      lista.push({
        clave: (soloActividades ? 'ab' : 'b') + p.id, periodo: p, nombre: `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}`,
        desde: p.fechaInicio, hasta: p.fechaFin, carpetas: soloActividades ? [] : vistas,
      });
      if (soloActividades) lista[lista.length - 1].carpetas = [{ carpeta: null, clave: 'ab-items' + p.id, nombre: '', items: vistas.flatMap(v => v.items) }];
    }
    const resto = items.filter(i => !usados.has(i.clave));
    if (resto.length) {
      lista.push({
        clave: soloActividades ? 'ab-otras' : 'b-otras', periodo: null, nombre: delAnio.length ? 'Otras fechas' : 'Contenido publicado',
        desde: null, hasta: null, carpetas: [{ carpeta: null, clave: (soloActividades ? 'ab' : '') + 'sin-otras', nombre: 'Contenido sin carpeta', items: resto }],
      });
    }
    return lista;
  }

  itemsDe(b: Bimestre): Item[] { return b.carpetas.flatMap(c => c.items); }

  /** Al entrar: se abre el bimestre actual y su última carpeta. */
  private abrirPorDefecto(): void {
    if (this.cargando() || !this.periodos().length) return;
    const hoy = aIso(new Date());
    const s = new Set(this.abiertas());
    const actual = this.bimestres().find(b => b.periodo?.activo) ?? this.bimestres().find(b => b.desde && b.hasta && hoy >= b.desde && hoy <= b.hasta)
      ?? [...this.bimestres()].reverse().find(b => b.carpetas.length);
    if (actual) {
      s.add(actual.clave);
      const ultima = actual.carpetas[actual.carpetas.length - 1];
      if (ultima) s.add(ultima.clave);
      s.add('a' + actual.clave);
    }
    this.abiertas.set(s);
  }

  estaAbierta(clave: string): boolean { return this.abiertas().has(clave); }

  abrir(clave: string, forzar = false): void {
    this.abiertas.update(s => {
      const n = new Set(s);
      if (n.has(clave) && !forzar) n.delete(clave); else n.add(clave);
      return n;
    });
  }

  estilo(i: Item): EstiloItem { return i.actividad ? estiloActividad(i.actividad) : estiloMaterial(i.material!); }
  titulo(i: Item): string { return i.actividad ? i.actividad.titulo : i.material!.titulo; }
  visible(i: Item): boolean { return i.actividad ? i.actividad.visible !== false : i.material!.visible !== false; }

  /** Etiqueta del final de la fila: tipo de archivo o de entrega. */
  detalleItem(i: Item): string {
    if (i.actividad) return i.actividad.tipo === 'CUESTIONARIO' ? 'Cuestionario' : 'Archivo/Tarea';
    const m = i.material!;
    return m.archivo ? 'Documento ' + extension(m.archivo.nombre) : m.enlace ? 'Enlace' : 'Texto';
  }

  // ---------------- Menú ⋮ ----------------

  alternarMenu(clave: string, ev: Event): void {
    ev.stopPropagation();
    this.menu.update(m => m === clave ? null : clave);
  }

  @HostListener('document:click')
  cerrarMenu(): void { this.menu.set(null); }

  // ---------------- Carpetas ----------------

  nuevaCarpeta(): void {
    if (!this.periodoActivo()) {
      this.mostrarAviso('No hay un bimestre activo. Pide a la administración que active el bimestre actual.');
      return;
    }
    this.errorCarpeta.set(null);
    this.carpetaModal.set({ id: null, nombre: '' });
  }

  renombrar(c: Carpeta): void {
    this.menu.set(null);
    this.errorCarpeta.set(null);
    this.carpetaModal.set({ id: c.id, nombre: c.nombre });
  }

  guardarCarpeta(): void {
    const m = this.carpetaModal();
    if (!m) return;
    const nombre = m.nombre.trim();
    if (!nombre) { this.errorCarpeta.set('Escribe el nombre de la carpeta.'); return; }
    this.guardandoCarpeta.set(true);
    const op = m.id ? this.aula.renombrarCarpeta(m.id, nombre) : this.aula.crearCarpeta(this.id, nombre);
    op.subscribe({
      next: (c) => {
        this.guardandoCarpeta.set(false);
        this.carpetaModal.set(null);
        this.carpetas.update(l => m.id ? l.map(x => x.id === c.id ? c : x) : [...l, c]);
        this.toast.exito(m.id ? 'Carpeta renombrada.' : `Carpeta "${c.nombre}" creada.`);
        this.abrir('b' + c.periodoId, true);
        this.abrir('f' + c.id, true);
      },
      error: (e) => { this.guardandoCarpeta.set(false); this.errorCarpeta.set(e?.error?.mensaje ?? 'No se pudo guardar la carpeta.'); },
    });
  }

  visibleCarpeta(c: Carpeta): void {
    this.menu.set(null);
    this.aula.visibleCarpeta(c.id, !c.visible).subscribe({
      next: (n) => { this.carpetas.update(l => l.map(x => x.id === n.id ? n : x)); this.toast.exito(n.visible ? 'Carpeta visible para los alumnos.' : 'Carpeta oculta para los alumnos.'); },
      error: (e) => this.mostrarAviso(e?.error?.mensaje ?? 'No se pudo cambiar la carpeta.'),
    });
  }

  async eliminarCarpeta(c: Carpeta): Promise<void> {
    this.menu.set(null);
    if (!await this.confirmar.pedir(`¿Eliminar la carpeta "${c.nombre}"?`)) return;
    this.aula.eliminarCarpeta(c.id).subscribe({
      next: () => { this.carpetas.update(l => l.filter(x => x.id !== c.id)); this.toast.exito('Carpeta eliminada.'); },
      error: (e) => this.mostrarAviso(e?.error?.mensaje ?? 'No se pudo eliminar la carpeta.'),
    });
  }

  // ---------------- Contenido ----------------

  agregarEn(c: Carpeta, ev?: Event): void {
    ev?.stopPropagation();
    this.formulario.set({ carpetaId: c.id, carpetaNombre: c.nombre, material: null, actividad: null, tipo: 'TEXTO' });
  }

  editar(i: Item): void {
    this.menu.set(null);
    const carpetaId = (i.material ? i.material.carpetaId : i.actividad!.carpetaId) ?? null;
    this.formulario.set({
      carpetaId, carpetaNombre: this.carpetas().find(c => c.id === carpetaId)?.nombre ?? '',
      material: i.material ?? null, actividad: i.actividad ?? null, tipo: 'TEXTO',
    });
  }

  alGuardar(): void {
    this.formulario.set(null);
    this.recargar();
  }

  alternarVisible(i: Item): void {
    this.menu.set(null);
    if (i.material) {
      this.aula.visibleMaterial(i.material.id, !this.visible(i)).subscribe({
        next: (m) => { this.materiales.update(l => l.map(x => x.id === m.id ? m : x)); this.toast.exito(m.visible === false ? 'Contenido oculto para los alumnos.' : 'Contenido visible para los alumnos.'); },
        error: (e) => this.mostrarAviso(e?.error?.mensaje ?? 'No se pudo cambiar.'),
      });
    } else {
      this.aula.visibleActividad(i.actividad!.id, !this.visible(i)).subscribe({
        next: (a) => {
          this.actividades.update(l => l.map(x => x.id === a.id ? a : x));
          if (this.actividadDetalle()?.id === a.id) this.actividadDetalle.set(a);
          this.toast.exito(a.visible === false ? 'Actividad oculta para los alumnos.' : 'Actividad visible para los alumnos.');
        },
        error: (e) => this.mostrarAviso(e?.error?.mensaje ?? 'No se pudo cambiar.'),
      });
    }
  }

  async eliminar(i: Item): Promise<void> {
    this.menu.set(null);
    const nombre = this.titulo(i);
    const extra = i.actividad ? ' También se borrarán sus entregas y su nota en Participación.' : '';
    if (!await this.confirmar.pedir(`¿Eliminar "${nombre}"?${extra}`)) return;
    const op = i.material ? this.aula.eliminarMaterial(i.material.id) : this.aula.eliminarActividad(i.actividad!.id);
    op.subscribe({
      next: () => {
        if (i.material) this.materiales.update(l => l.filter(x => x.id !== i.material!.id));
        else {
          this.actividades.update(l => l.filter(x => x.id !== i.actividad!.id));
          if (this.actividadDetalle()?.id === i.actividad!.id) this.actividadDetalle.set(null);
        }
        this.toast.exito(`"${nombre}" eliminado.`);
      },
      error: (e) => this.mostrarAviso(e?.error?.mensaje ?? 'No se pudo eliminar.'),
    });
  }

  abrirItem(i: Item): void {
    if (i.actividad) {
      this.pestana.set('actividades');
      this.router.navigate([], { queryParams: { tab: 'actividades' }, queryParamsHandling: 'merge', replaceUrl: true });
      this.actividadDetalle.set(i.actividad);
    } else {
      this.abrirMaterial(i.material!);
    }
  }

  abrirActividad(a: Actividad): void { this.actividadDetalle.set(a); }

  private mostrarAviso(texto: string): void {
    this.toast.error(texto);
  }

  // ---------------- Panel de material ----------------

  abrirMaterial(m: Material): void {
    this.material.set(m);
  }

  descargar(m: Material): void { if (m.archivo) this.archivos.descargar(m.archivo); }

  cerrarPanel(): void {
    this.material.set(null);
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.formulario()) return;
    this.carpetaModal.set(null);
    this.cerrarPanel();
    this.menu.set(null);
  }
}

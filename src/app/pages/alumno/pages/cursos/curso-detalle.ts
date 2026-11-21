import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AulaService } from '../../../../core/services/aula.service';
import { AsistenciaService } from '../../../../core/services/asistencia.service';
import { NotaService } from '../../../../core/services/nota.service';
import { PeriodoService } from '../../../../core/services/periodo.service';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { ArchivoService, extension, tamanioLegible } from '../../../../core/services/archivo.service';
import { Actividad, Carpeta as CarpetaCurso, CursoAula, Material, Participantes } from '../../../../core/models/aula.model';
import { AsistenciaAlumno, EstadoAsistencia } from '../../../../core/models/asistencia.model';
import { CursoBoleta, PeriodoCorto, colorNota, etiquetaEvaluacion } from '../../../../core/models/nota.model';
import { Periodo, ROMANOS } from '../../../../core/models/periodo.model';
import { BloqueHorario } from '../../../../core/models/horario.model';
import { categoriaDe } from '../../../../core/models/curso.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { fechaCorta, fechaHora, iniciales, num, plazo } from '../../../../core/utils/texto';
import { IconoCategoria } from '../../../../shared/components/icono-categoria/icono-categoria';
import { VistaPrevia } from '../../../../shared/components/vista-previa/vista-previa';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../services/auth';
import { Hijo, HijosService } from '../../../../core/services/hijos.service';

type Pestana = 'contenido' | 'actividades' | 'asistencia' | 'examenes';

interface Item {
  clave: string;
  fecha: string;
  material?: Material;
  actividad?: Actividad;
}

interface Semana { numero: number; clave: string; nombre: string; detalle: string; items: Item[]; }

interface Carpeta { clave: string; nombre: string; desde: string | null; hasta: string | null; semanas: Semana[]; items: Item[]; }

interface Estilo { etiqueta: string; color: string; fondo: string; icono: 'doc' | 'texto' | 'enlace' | 'tarea' | 'cuestionario' | 'actividad'; }

const ESTADO_ASISTENCIA: Record<EstadoAsistencia, { etiqueta: string; color: string; fondo: string }> = {
  PRESENTE: { etiqueta: 'Asistió', color: '#1E7A3B', fondo: '#E7F3EA' },
  TARDANZA: { etiqueta: 'Tardanza', color: '#9A6B00', fondo: '#FDF1DC' },
  FALTA: { etiqueta: 'Faltó', color: '#A62639', fondo: '#FBE7E9' },
  JUSTIFICADA: { etiqueta: 'Justificado', color: '#6D28D9', fondo: '#F0EAFD' },
};

const COLOR_EVALUACION: Record<string, { color: string; fondo: string }> = {
  EXAMEN: { color: '#DC2626', fondo: '#FDE8E8' },
  PRACTICA: { color: '#2563EB', fondo: '#E6EEFB' },
  TAREA: { color: '#059669', fondo: '#E3F4EC' },
  CUESTIONARIO: { color: '#EA580C', fondo: '#FDEBDD' },
  ACTIVIDAD: { color: '#0D9488', fondo: '#DDF3F1' },
  PARTICIPACION: { color: '#7C3AED', fondo: '#F0EAFD' },
  PROYECTO: { color: '#D97706', fondo: '#FDF1DC' },
  OTRO: { color: '#6B5A67', fondo: '#F0E6D8' },
};

@Component({
  selector: 'app-alumno-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, IconoCategoria, VistaPrevia],
  templateUrl: './curso-detalle.html',
})
export class AlumnoCursoDetalle implements OnInit {
  private toast = inject(ToastService);

  private aula = inject(AulaService);
  private asistenciaService = inject(AsistenciaService);
  private notaService = inject(NotaService);
  private periodoService = inject(PeriodoService);
  private miHorarioService = inject(MiHorarioService);
  private archivos = inject(ArchivoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private hijosService = inject(HijosService);

  readonly esPadre = ['padre', 'familiar', 'apoderado'].includes((inject(AuthService).obtenerRol() ?? '').toLowerCase());
  estudianteId: number | null = null;
  hijo = signal<Hijo | null>(null);
  volver: (string | number)[] = ['/home', 'alumno', 'cursos'];

  readonly fechaCorta = fechaCorta;
  readonly dmy = dmy;
  readonly dmyHora = dmyHora;
  readonly fechaHora = fechaHora;
  readonly plazo = plazo;
  readonly num = num;
  readonly iniciales = iniciales;
  readonly tam = tamanioLegible;
  readonly extension = extension;
  readonly colorNota = colorNota;
  readonly etiquetaEvaluacion = etiquetaEvaluacion;
  readonly estadosAsistencia = ESTADO_ASISTENCIA;

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
  carpetasCurso = signal<CarpetaCurso[]>([]);
  participantes = signal<Participantes | null>(null);
  periodos = signal<Periodo[]>([]);
  bloques = signal<BloqueHorario[]>([]);
  error = signal<string | null>(null);
  cargandoContenido = signal(true);

  asistencia = signal<AsistenciaAlumno | null>(null);
  cargandoAsistencia = signal(false);
  ordenAsc = signal(false);
  boleta = signal<CursoBoleta | null>(null);
  periodosBoleta = signal<PeriodoCorto[]>([]);
  cargandoNotas = signal(false);

  abiertas = signal<Set<string>>(new Set());
  verEstructura = signal(true);
  verProfesor = signal(true);
  verParticipantes = signal(true);

  material = signal<Material | null>(null);
  actividad = signal<Actividad | null>(null);

  readonly anio = new Date().getFullYear();

  categoria = computed(() => categoriaDe(this.curso()?.categoria));
  salon = computed(() => {
    const c = this.curso();
    return c ? `${infoGrado(c.grado)?.titulo ?? c.grado} “${c.letra}”` : '';
  });
  nivel = computed(() => (this.curso()?.grado ?? '').includes('Secundaria') ? 'Secundaria' : 'Primaria');
  periodosAnio = computed(() => this.periodos().filter(p => p.anio === this.anio).sort((a, b) => a.bimestre - b.bimestre));
  periodoActivo = computed(() => this.periodos().find(p => p.activo) ?? null);

  carpetas = computed<Carpeta[]>(() => {
    const items: Item[] = [
      ...this.materiales().map(m => ({ clave: 'm' + m.id, fecha: m.fechaPublicacion, material: m })),
      ...this.actividades().map(a => ({ clave: 'a' + a.id, fecha: a.fechaPublicacion, actividad: a })),
    ].sort((x, y) => x.fecha.localeCompare(y.fecha));
    return this.agrupar(items, true);
  });

  carpetasActividades = computed<Carpeta[]>(() => {
    const items: Item[] = this.actividades()
      .map(a => ({ clave: 'a' + a.id, fecha: a.fechaLimite, actividad: a }))
      .sort((x, y) => x.fecha.localeCompare(y.fecha));
    return this.agrupar(items, false);
  });

  asistenciaPorBimestre = computed(() => {
    const a = this.asistencia();
    const c = this.curso();
    if (!a || !c) return [];
    const filas = a.detalle.filter(d => d.curso === c.curso)
      .sort((x, y) => this.ordenAsc() ? x.fecha.localeCompare(y.fecha) : y.fecha.localeCompare(x.fecha));
    const grupos = this.periodosAnio().map(p => ({
      clave: 'as' + p.id, nombre: `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}`,
      filas: filas.filter(f => f.fecha >= p.fechaInicio && f.fecha <= p.fechaFin),
    }));
    const sueltas = filas.filter(f => !this.periodosAnio().some(p => f.fecha >= p.fechaInicio && f.fecha <= p.fechaFin));
    if (sueltas.length) grupos.push({ clave: 'as-otras', nombre: 'Otras fechas', filas: sueltas });
    return grupos.filter(g => g.filas.length || this.periodosAnio().length);
  });

  resumenAsistencia = computed(() => {
    const c = this.curso();
    return this.asistencia()?.cursos.find(x => x.seccionCursoId === c?.seccionCursoId)?.conteo ?? null;
  });

  vencio(fecha: string | null | undefined): boolean {
    return !!fecha && new Date(fecha).getTime() <= Date.now();
  }

  vencidaSinEntrega(a: Actividad | null | undefined): boolean {
    return !!a && !a.miEntrega && this.vencio(a.fechaLimite);
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    const est = this.route.snapshot.paramMap.get('estudianteId');
    if (this.esPadre) {
      this.estudianteId = est ? Number(est) : null;
      this.volver = ['/home', 'padre', 'hijos'];
      if (this.estudianteId) {
        this.hijosService.elegir(this.estudianteId);
        this.hijosService.listar().subscribe({ next: (h) => this.hijo.set(h.find(x => x.id === this.estudianteId) ?? null), error: () => {} });
      }
    }
    const estado = (typeof history !== 'undefined' ? history.state : null) as { avisoEntrega?: { texto: string; tardia: boolean } } | null;
    if (estado?.avisoEntrega) {
      if (estado.avisoEntrega.tardia) this.toast.aviso(estado.avisoEntrega.texto, 8000);
      else this.toast.exito(estado.avisoEntrega.texto, 6000);
    }
    const tab = this.route.snapshot.queryParamMap.get('tab') as Pestana | null;
    if (tab && this.pestanas.some(p => p.id === tab)) this.cambiarPestana(tab);

    this.aula.curso(this.id).subscribe({
      next: (c) => this.curso.set(c),
      error: (e) => this.error.set(e?.error?.mensaje ?? 'No se pudo abrir el curso.'),
    });
    let pendientes = 3;
    const fin = () => { if (--pendientes === 0) { this.cargandoContenido.set(false); this.abrirPorDefecto(); } };
    this.aula.materiales(this.id).subscribe({ next: (m) => { this.materiales.set(m); fin(); }, error: () => fin() });
    this.aula.carpetas(this.id).subscribe({ next: (c) => { this.carpetasCurso.set(c); fin(); }, error: () => fin() });
    const actividades$ = this.esPadre && this.estudianteId
      ? this.aula.actividadesHijo(this.estudianteId)
      : this.aula.actividades(this.id);
    actividades$.subscribe({
      next: (a) => { this.actividades.set(this.esPadre ? a.filter(x => x.seccionCursoId === this.id) : a); fin(); },
      error: () => fin(),
    });
    this.aula.participantes(this.id).subscribe({ next: (p) => this.participantes.set(p), error: () => {} });
    this.periodoService.listar().subscribe({ next: (p) => { this.periodos.set(p); this.periodosListos = true; this.abrirPorDefecto(); this.abrirExtras(); }, error: () => { this.periodosListos = true; this.abrirExtras(); } });
    const horario$ = this.esPadre && this.estudianteId ? this.miHorarioService.hijo(this.estudianteId) : this.miHorarioService.obtener();
    horario$.subscribe({
      next: (h) => this.bloques.set(h.cursos.find(c => c.id === this.id)?.bloques ?? []),
      error: () => {},
    });
  }

  cambiarPestana(p: Pestana): void {
    this.pestana.set(p);
    this.router.navigate([], { queryParams: { tab: p === 'contenido' ? null : p }, queryParamsHandling: 'merge', replaceUrl: true });
    if (p === 'asistencia' && !this.asistencia() && !this.cargandoAsistencia()) this.cargarAsistencia();
    if (p === 'examenes' && !this.boleta() && !this.cargandoNotas()) this.cargarNotas();
  }

  private cargarAsistencia(): void {
    this.cargandoAsistencia.set(true);
    const desde = `${this.anio}-01-01`, hasta = `${this.anio}-12-31`;
    const asistencia$ = this.esPadre && this.estudianteId
      ? this.asistenciaService.delAlumno(this.estudianteId, desde, hasta)
      : this.asistenciaService.mia(desde, hasta);
    asistencia$.subscribe({
      next: (a) => { this.asistencia.set(a); this.cargandoAsistencia.set(false); this.abrirExtras(); },
      error: (e) => { this.cargandoAsistencia.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo cargar la asistencia.'); },
    });
  }

  private cargarNotas(): void {
    this.cargandoNotas.set(true);
    const notas$ = this.esPadre && this.estudianteId ? this.notaService.boleta(this.estudianteId, this.anio) : this.notaService.mias(this.anio);
    notas$.subscribe({
      next: (b) => {
        this.boleta.set(b.cursos.find(c => c.seccionCursoId === this.id) ?? null);
        this.periodosBoleta.set(b.periodos);
        this.cargandoNotas.set(false);
        this.abrirExtras();
      },
      error: (e) => { this.cargandoNotas.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar las notas.'); },
    });
  }

  private agrupar(items: Item[], conSemanas: boolean): Carpeta[] {
    const periodos = this.periodosAnio();
    const usados = new Set<string>();
    const carpetas: Carpeta[] = [];
    const carpetasCurso = this.carpetasCurso();
    const carpetaDe = (i: Item) => (i.material ? i.material.carpetaId : i.actividad?.carpetaId) ?? null;
    const enCarpeta = (i: Item) => { const c = carpetaDe(i); return c !== null && carpetasCurso.some(x => x.id === c); };
    for (const p of periodos) {
      const delPeriodo = carpetasCurso.filter(c => c.periodoId === p.id);
      const enCarpetas = items.filter(i => delPeriodo.some(c => c.id === carpetaDe(i)));
      const sueltos = items.filter(i => !enCarpeta(i) && !usados.has(i.clave)
        && i.fecha.substring(0, 10) >= p.fechaInicio && i.fecha.substring(0, 10) <= p.fechaFin);
      const suyos = [...enCarpetas, ...sueltos];
      suyos.forEach(i => usados.add(i.clave));
      const subcarpetas: Semana[] = conSemanas
        ? [
            ...delPeriodo.map((c, k) => ({
              numero: k + 1, clave: 'f' + c.id, nombre: c.nombre, detalle: `Publicada el ${dmy(c.fechaCreacion)}`,
              items: enCarpetas.filter(i => carpetaDe(i) === c.id),
            })).filter(c => c.items.length),
            ...this.semanas(p, sueltos),
          ]
        : [];
      if (conSemanas && !suyos.length) continue;
      carpetas.push({
        clave: (conSemanas ? 'c' : 'ac') + p.id,
        nombre: `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}`,
        desde: p.fechaInicio, hasta: p.fechaFin,
        semanas: subcarpetas,
        items: suyos,
      });
    }
    const sueltos = items.filter(i => !usados.has(i.clave));
    if (sueltos.length) {
      carpetas.push({ clave: conSemanas ? 'c-otras' : 'ac-otras', nombre: periodos.length ? 'Otras fechas' : 'Contenido publicado', desde: null, hasta: null, semanas: [], items: sueltos });
    }
    return carpetas;
  }

  private semanas(p: Periodo, items: Item[]): Semana[] {
    const inicio = aFecha(p.fechaInicio);
    const fin = aFecha(p.fechaFin);
    const mapa = new Map<number, Semana>();
    for (const i of items) {
      const n = Math.floor((aFecha(i.fecha.substring(0, 10)).getTime() - inicio.getTime()) / 86_400_000 / 7) + 1;
      if (!mapa.has(n)) {
        const desde = new Date(inicio.getTime() + (n - 1) * 7 * 86_400_000);
        const hasta = new Date(Math.min(desde.getTime() + 6 * 86_400_000, fin.getTime()));
        mapa.set(n, { numero: n, clave: 's' + n, nombre: `Semana ${n}`, detalle: `Del ${dmy(aIso(desde))} al ${dmy(aIso(hasta))}`, items: [] });
      }
      mapa.get(n)!.items.push(i);
    }
    return [...mapa.values()].sort((a, b) => a.numero - b.numero);
  }

  private abrirPorDefecto(): void {
    if (this.cargandoContenido()) return;
    const carpetas = this.carpetas();
    const hoy = aIso(new Date());
    const actual = carpetas.find(c => c.desde && c.hasta && hoy >= c.desde && hoy <= c.hasta && c.items.length)
      ?? [...carpetas].reverse().find(c => c.items.length);
    const s = new Set(this.abiertas());
    if (actual) {
      s.add(actual.clave);
      const ultima = actual.semanas[actual.semanas.length - 1];
      if (ultima) s.add(actual.clave + '-' + ultima.clave);
    }
    const act = this.carpetasActividades().find(c => c.desde && c.hasta && hoy >= c.desde && hoy <= c.hasta && c.items.length)
      ?? [...this.carpetasActividades()].reverse().find(c => c.items.length);
    if (act) s.add(act.clave);
    this.abiertas.set(s);
  }

  private periodosListos = false;
  private extrasAbiertos = { asistencia: false, notas: false };

  private abrirExtras(): void {
    if (!this.periodosListos) return;
    if (this.asistencia() && !this.extrasAbiertos.asistencia) {
      this.extrasAbiertos.asistencia = true;
      const grupos = this.asistenciaPorBimestre();
      const g = grupos.find(x => x.clave === 'as' + this.periodoActivo()?.id && x.filas.length)
        ?? [...grupos].reverse().find(x => x.filas.length) ?? grupos[0];
      if (g) this.abrir(g.clave, true);
    }
    if (!this.cargandoNotas() && this.periodosBoleta().length && !this.extrasAbiertos.notas) {
      this.extrasAbiertos.notas = true;
      const per = this.boleta()?.periodos ?? [];
      const e = per.find(x => x.periodoId === this.periodoActivo()?.id && x.notas.length)
        ?? [...per].reverse().find(x => x.notas.length) ?? per[0];
      if (e) this.abrir('ex' + e.periodoId, true);
    }
  }

  estaAbierta(clave: string): boolean {
    return this.abiertas().has(clave);
  }

  abrir(clave: string, forzar = false): void {
    this.abiertas.update(s => {
      const n = new Set(s);
      if (n.has(clave) && !forzar) n.delete(clave); else n.add(clave);
      return n;
    });
  }

  estilo(i: Item): Estilo {
    if (i.actividad) {
      switch (i.actividad.tipo) {
        case 'CUESTIONARIO': return { etiqueta: 'Cuestionario', color: '#FFFFFF', fondo: '#F97316', icono: 'cuestionario' };
        case 'ACTIVIDAD': return { etiqueta: 'Actividad', color: '#0D9488', fondo: '#DDF3F1', icono: 'actividad' };
        default: return { etiqueta: 'Tarea', color: '#059669', fondo: '#E3F4EC', icono: 'tarea' };
      }
    }
    const m = i.material!;
    if (m.tipo === 'TEXTO') return { etiqueta: 'Texto', color: '#2563EB', fondo: '#E6EEFB', icono: 'texto' };
    if (m.archivo) return { etiqueta: 'Documento', color: '#9333EA', fondo: '#F3E8FD', icono: 'doc' };
    if (m.enlace) return { etiqueta: 'Enlace', color: '#0891B2', fondo: '#E0F3F8', icono: 'enlace' };
    return { etiqueta: 'Texto', color: '#2563EB', fondo: '#E6EEFB', icono: 'texto' };
  }

  titulo(i: Item): string {
    return i.actividad ? i.actividad.titulo : i.material!.titulo;
  }

  abierta(a: Actividad): boolean {
    if (a.tipo !== 'CUESTIONARIO' && a.miEntrega?.estado === 'CALIFICADA') return false;
    if (a.miEntrega && (a.miEntrega.intentos ?? 1) >= (a.intentosPermitidos ?? 1)) return false;
    return new Date(a.fechaLimite).getTime() > Date.now() || !!a.permiteTardia;
  }

  tardiaAbierta(a: Actividad): boolean {
    return this.abierta(a) && new Date(a.fechaLimite).getTime() <= Date.now();
  }

  intentos(a: Actividad): string {
    const usados = a.miEntrega ? (a.miEntrega.intentos ?? 1) : 0;
    return `${usados} de ${a.intentosPermitidos ?? 1}`;
  }

  colorPastilla(a: Actividad): { color: string; fondo: string } {
    const e = a.miEntrega;
    if (e?.estado === 'CALIFICADA') return colorNota(e.nota20);
    if (e) return { color: '#1D4ED8', fondo: '#E6EEFB' };
    if (this.abierta(a)) return { color: '#9A6B00', fondo: '#FDF1DC' };
    return { color: '#A62639', fondo: '#FBE7E9' };
  }

  textoPastilla(a: Actividad): string {
    const e = a.miEntrega;
    if (e?.estado === 'CALIFICADA') return `${num(e.nota20, 1)}/20`;
    if (e) return 'Entregada';
    return this.abierta(a) ? 'Pendiente' : 'No entregada';
  }

  colorEvaluacion(tipo: string): { color: string; fondo: string } {
    return COLOR_EVALUACION[tipo] ?? COLOR_EVALUACION['OTRO'];
  }

  horaClase(fecha: string): string {
    const dia = aFecha(fecha).getDay();
    const b = this.bloques().filter(x => x.dia === dia).sort((x, y) => x.horaInicio.localeCompare(y.horaInicio))[0];
    return b ? horaAmPm(b.horaInicio) : '—';
  }

  nombrePeriodo(id: number): string {
    const p = this.periodosBoleta().find(x => x.id === id);
    return p ? `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}` : 'Periodo';
  }

  rangoPeriodo(id: number): string {
    const p = this.periodos().find(x => x.id === id);
    return p ? `${dmy(p.fechaInicio)} - ${dmy(p.fechaFin)}` : '';
  }

  abrirItem(i: Item): void {
    if (i.actividad) this.abrirActividad(i.actividad);
    else this.abrirMaterial(i.material!);
  }

  abrirActividad(a: Actividad): void {
    this.material.set(null);
    this.actividad.set(a);
  }

  abrirMaterial(m: Material): void {
    this.actividad.set(null);
    this.material.set(m);
  }

  descargar(m: Material): void {
    if (m.archivo) this.archivos.descargar(m.archivo);
  }

  cerrarPanel(): void {
    this.material.set(null);
    this.actividad.set(null);
  }

  irAEntrega(a: Actividad): void {
    if (this.esPadre) return;
    this.router.navigate(['/home', 'alumno', 'cursos', this.id, 'actividad', a.id]);
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    this.cerrarPanel();
  }
}

function aFecha(iso: string): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function aIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function horaAmPm(h: string): string {
  const [hh, mm] = h.split(':').map(Number);
  const sufijo = hh < 12 ? 'a. m.' : 'p. m.';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${sufijo}`;
}

export function dmy(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function dmyHora(iso: string | null | undefined): string {
  if (!iso) return '';
  const hora = iso.length >= 16 ? iso.substring(11, 16) : '';
  return dmy(iso) + (hora ? `, ${hora}` : '');
}

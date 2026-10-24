import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth';
import { AgendaService } from '../../../../core/services/agenda.service';
import { Hijo, HijosService } from '../../../../core/services/hijos.service';
import { Cita, EstadoCita, HorarioLibre, PadreContacto, PersonaCita, Responsable } from '../../../../core/models/cita.model';
import { esAdministrativo, fechaCorta, hoyIso, iniciales } from '../../../../core/utils/texto';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

type Filtro = 'TODOS' | 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'REALIZADA';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ESTADO: Record<EstadoCita, { etiqueta: string; color: string; fondo: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#9A6B00', fondo: '#FDF1DC' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#1E7A3B', fondo: '#E7F3EA' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#A62639', fondo: '#FBE7E9' },
  RECHAZADA: { etiqueta: 'Cancelada', color: '#A62639', fondo: '#FBE7E9' },
  REALIZADA: { etiqueta: 'Realizada', color: '#2563EB', fondo: '#E6EEFB' },
};

interface Dia { fecha: string; numero: number; delMes: boolean; habil: boolean; }

/**
 * Mi Agenda > Mis Citas (docente, administración y padres de familia).
 * Tabla de citas ENVIADAS y RECIBIDAS. Acciones según el estado:
 *   Enviada: pendiente → ver / eliminar · confirmada → ver · cancelada → ver (con motivo).
 *   Recibida: pendiente → aceptar / ver / cancelar · confirmada → ver / cancelar · cancelada → ver.
 * El docente cita a padres de sus aulas dentro de su disponibilidad; la administración cita a padres,
 * docentes o alumnos en cualquier horario; el padre solicita en los horarios libres de los docentes.
 */
@Component({
  imports: [FotoUsuario, CommonModule, FormsModule],
  selector: 'app-mis-citas',
  templateUrl: './mis-citas.html',
})
export class MisCitas implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);
  private auth = inject(AuthService);
  private agenda = inject(AgendaService);
  private hijosService = inject(HijosService);

  readonly estados = ESTADO;
  readonly fechaCorta = fechaCorta;
  readonly iniciales = iniciales;
  readonly hoy = hoyIso();
  readonly yo = this.auth.obtenerUsuario()?.id ?? 0;
  readonly esPadre = ['padre', 'familiar', 'apoderado'].includes(this.auth.obtenerRol().toLowerCase());
  readonly esAdmin = esAdministrativo(this.auth.obtenerRol());
  readonly diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  readonly duraciones = [15, 30, 45, 60];

  citas = signal<Cita[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);
  filtro = signal<Filtro>('TODOS');

  totales = computed(() => {
    const l = this.citas();
    return {
      total: l.length,
      pendientes: l.filter(c => c.estado === 'PENDIENTE').length,
      confirmadas: l.filter(c => c.estado === 'CONFIRMADA').length,
      canceladas: l.filter(c => c.estado === 'CANCELADA' || c.estado === 'RECHAZADA').length,
    };
  });

  lista = computed(() => {
    const f = this.filtro();
    return this.citas()
      .filter(c => f === 'TODOS' || c.estado === f || (f === 'CANCELADA' && c.estado === 'RECHAZADA'))
      .sort((a, b) => {
        // Primero las próximas (más cercanas), luego las pasadas (más recientes primero).
        if (a.pasada !== b.pasada) return a.pasada ? 1 : -1;
        const x = a.fecha + a.horaInicio, y = b.fecha + b.horaInicio;
        return a.pasada ? y.localeCompare(x) : x.localeCompare(y);
      });
  });

  // ---- Ver / cancelar
  detalle = signal<Cita | null>(null);
  cancelando = signal<Cita | null>(null);
  motivoCancelacion = '';
  procesando = signal(false);
  errorAccion = signal<string | null>(null);

  // ---- Nueva cita (docente / administración)
  panelNueva = signal(false);
  padres = signal<PadreContacto[]>([]);
  personas = signal<PersonaCita[]>([]);
  aulaElegida = signal<string>('');
  buscar = signal('');
  padreElegido = signal<{ id: number; nombre: string; detalle: string; estudianteId: number | null } | null>(null);
  nMotivo = '';
  nDuracion = 30;
  nDetalle = '';
  nFecha = signal<string | null>(null);
  nHora = signal<string | null>(null);
  nHoraLibre = '';
  horasLibres = signal<string[]>([]);
  cargandoHoras = signal(false);
  diasDisponibles = signal<Set<number>>(new Set());
  mes = signal(primerDiaMes(new Date()));
  errorPanel = signal<string | null>(null);
  enviando = signal(false);

  aulas = computed(() => [...new Set(this.padres().flatMap(p => p.hijos.map(h => h.salon)))].sort());
  candidatos = computed(() => {
    const t = this.buscar().toLowerCase().trim();
    if (this.esAdmin) {
      return this.personas()
        .filter(p => !t || p.nombre.toLowerCase().includes(t) || p.rol.toLowerCase().includes(t) || (p.detalle ?? '').toLowerCase().includes(t))
        .slice(0, 40)
        .map(p => ({ id: p.id, nombre: p.nombre, detalle: p.rol + (p.detalle ? ' · ' + p.detalle : ''), estudianteId: null as number | null }));
    }
    const aula = this.aulaElegida();
    if (!aula) return [];
    return this.padres().flatMap(p => p.hijos.filter(h => h.salon === aula).map(h => ({
      id: p.usuarioId, nombre: p.nombre, detalle: `Padre/tutor de ${h.nombre}`, estudianteId: h.id as number | null,
    }))).filter(p => !t || p.nombre.toLowerCase().includes(t) || p.detalle.toLowerCase().includes(t));
  });
  tituloMes = computed(() => `${MESES[this.mes().getMonth()]} ${this.mes().getFullYear()}`);
  calendario = computed<Dia[]>(() => {
    const m = this.mes();
    const inicio = new Date(m);
    inicio.setDate(1 - ((m.getDay() + 6) % 7));
    const dias: Dia[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const iso = aIso(d);
      const dia = ((d.getDay() + 6) % 7) + 1;
      const habil = iso >= this.hoy && (this.esAdmin ? dia <= 6 : this.diasDisponibles().has(dia));
      dias.push({ fecha: iso, numero: d.getDate(), delMes: d.getMonth() === m.getMonth(), habil });
    }
    // Sin la última semana si es toda del mes siguiente.
    return dias.slice(35).every(x => !x.delMes) ? dias.slice(0, 35) : dias;
  });

  // ---- Padre: solicitar
  panelSolicitar = signal(false);
  hijos = signal<Hijo[]>([]);
  responsables = signal<Responsable[]>([]);
  responsable = signal<Responsable | null>(null);
  horarios = signal<HorarioLibre[]>([]);
  cargandoHorarios = signal(false);
  horarioElegido = signal<HorarioLibre | null>(null);
  hijoElegido: number | null = null;
  motivo = '';
  dias = computed(() => {
    const mapa = new Map<string, HorarioLibre[]>();
    this.horarios().forEach(h => mapa.set(h.fecha, [...(mapa.get(h.fecha) ?? []), h]));
    return [...mapa.entries()].map(([fecha, horas]) => ({ fecha, horas }));
  });
  diaElegido = signal<string | null>(null);
  /** Descripción del caso (paso 4). */
  detalleCaso = '';
  buscarResponsable = signal('');
  verSugerencias = signal(false);
  /** Lunes de la semana que se ve en el calendario (yyyy-MM-dd). */
  semana = signal<string>(lunesDe(hoyIso()));

  responsablesFiltrados = computed(() => {
    const t = this.buscarResponsable().toLowerCase().trim();
    return this.responsables().filter(r => !t || r.nombre.toLowerCase().includes(t) || r.rol.toLowerCase().includes(t)
      || (r.detalle ?? '').toLowerCase().includes(t) || r.relacion.some(x => x.toLowerCase().includes(t)));
  });

  /** Duración de las citas del responsable (la fija su disponibilidad; normalmente 30 min). */
  duracion = computed(() => {
    const h = this.horarios()[0];
    return h ? minutos(h.horaFin) - minutos(h.horaInicio) : 30;
  });

  /** Lunes a viernes de la semana visible. */
  diasSemana5 = computed(() => [0, 1, 2, 3, 4].map(i => sumarDias(this.semana(), i)));

  /** Horarios libres de la semana visible. */
  libresSemana = computed(() => {
    const dias = this.diasSemana5();
    return this.horarios().filter(h => dias.includes(h.fecha));
  });

  /** Filas de 15 minutos del calendario (desde el primer al último horario de la semana). */
  filasCal = computed(() => {
    const l = this.libresSemana();
    const ini = l.length ? Math.min(...l.map(h => minutos(h.horaInicio))) : 8 * 60;
    const fin = l.length ? Math.max(...l.map(h => minutos(h.horaFin))) : 13 * 60;
    const filas: number[] = [];
    for (let t = Math.floor(ini / 15) * 15; t < fin; t += 15) filas.push(t);
    return filas;
  });

  hayAntes = computed(() => this.horarios().some(h => h.fecha < this.semana()));
  hayDespues = computed(() => this.horarios().some(h => h.fecha > sumarDias(this.semana(), 6)));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.agenda.citas().subscribe({
      next: (c) => { this.citas.set(c); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar tus citas.'); },
    });
  }

  /** La otra persona de la cita (con quien me reúno). */
  otra(c: Cita): { nombre: string; detalle: string } {
    if (c.padre.id === this.yo) return { nombre: c.responsable.nombre, detalle: c.responsable.rol + (c.responsable.detalle ? ' · ' + c.responsable.detalle : '') };
    if (c.miRol === 'ALUMNO') return { nombre: c.responsable.nombre, detalle: `Con ${c.padre.nombre}` };
    const rol = (c.padre.rol || '').toLowerCase();
    const esPadreFamilia = !rol || rol.includes('padre') || rol.includes('famil') || rol.includes('apoder');
    if (c.estudiante && esPadreFamilia) return { nombre: c.padre.nombre, detalle: `Padre/tutor de ${c.estudiante.nombre}` };
    return { nombre: c.padre.nombre, detalle: c.padre.rol || 'Padre de familia' };
  }

  /** Quien creó la cita (el "solicitante"). */
  solicitante(c: Cita): { nombre: string; rol: string } {
    const creador = c.origen === 'SOLICITUD_PADRE' ? c.padre : c.responsable;
    return { nombre: creador.nombre, rol: creador.rol || (c.origen === 'SOLICITUD_PADRE' ? 'Padre / Tutor' : 'Docente') };
  }

  fechaHora(c: Cita): string { return `${dmy(c.fecha)} ${c.horaInicio}`; }

  esCancelada(c: Cita): boolean { return c.estado === 'CANCELADA' || c.estado === 'RECHAZADA'; }

  private actualizar(c: Cita, mensaje: string): void {
    this.citas.update(l => l.map(x => x.id === c.id ? c : x));
    if (this.detalle()?.id === c.id) this.detalle.set(c);
    this.toast.exito(mensaje);
  }

  // ================= Acciones =================

  async aceptar(c: Cita): Promise<void> {
    if (!await this.confirmar.pedir(`¿Aceptar la cita con ${this.otra(c).nombre} el ${this.fechaHora(c)}?`)) return;
    this.agenda.confirmar(c.id, null).subscribe({
      next: (n) => this.actualizar(n, 'Cita aceptada. Se avisó a quien la envió.'),
      error: (e) => this.error.set(e?.error?.mensaje ?? 'No se pudo aceptar la cita.'),
    });
  }

  abrirCancelar(c: Cita): void {
    this.cancelando.set(c);
    this.motivoCancelacion = '';
    this.errorAccion.set(null);
  }

  cancelar(): void {
    const c = this.cancelando();
    if (!c) return;
    const motivo = this.motivoCancelacion.trim();
    if (!motivo) { this.errorAccion.set('Escribe el motivo detallado de la cancelación.'); return; }
    if (motivo.length < 5) { this.errorAccion.set('El motivo debe tener al menos 5 caracteres.'); return; }
    this.procesando.set(true);
    this.agenda.cancelar(c.id, motivo).subscribe({
      next: (n) => { this.procesando.set(false); this.cancelando.set(null); this.actualizar(n, 'Cita cancelada. Se envió el motivo a la otra persona.'); },
      error: (e) => { this.procesando.set(false); this.errorAccion.set(e?.error?.mensaje ?? 'No se pudo cancelar la cita.'); },
    });
  }

  async eliminar(c: Cita): Promise<void> {
    if (!await this.confirmar.pedir(`¿Eliminar la solicitud de cita con ${this.otra(c).nombre} del ${this.fechaHora(c)}?`)) return;
    this.agenda.eliminar(c.id).subscribe({
      next: () => { this.citas.update(l => l.filter(x => x.id !== c.id)); this.toast.exito('Solicitud eliminada. Se avisó a la otra persona.'); },
      error: (e) => this.error.set(e?.error?.mensaje ?? 'No se pudo eliminar la cita.'),
    });
  }

  // ================= Nueva cita (docente / administración) =================

  abrirNueva(): void {
    this.panelNueva.set(true);
    this.aulaElegida.set('');
    this.buscar.set('');
    this.padreElegido.set(null);
    this.nMotivo = '';
    this.nDuracion = 30;
    this.nDetalle = '';
    this.nFecha.set(null);
    this.nHora.set(null);
    this.nHoraLibre = '';
    this.horasLibres.set([]);
    this.mes.set(primerDiaMes(new Date()));
    this.errorPanel.set(null);
    if (this.esAdmin) {
      this.agenda.personas().subscribe({
        next: (p) => this.personas.set(p),
        error: (e) => this.errorPanel.set(e?.error?.mensaje ?? 'No se pudo cargar la lista de personas.'),
      });
    } else {
      this.agenda.padres().subscribe({
        next: (p) => this.padres.set(p),
        error: (e) => this.errorPanel.set(e?.error?.mensaje ?? 'No se pudo cargar la lista de padres.'),
      });
      this.agenda.disponibilidad().subscribe({
        next: (d) => this.diasDisponibles.set(new Set(d.filter(x => x.activo).map(x => x.dia))),
        error: () => {},
      });
    }
  }

  elegirAula(a: string): void {
    this.aulaElegida.set(a);
    this.padreElegido.set(null);
    this.buscar.set('');
  }

  moverMes(n: number): void {
    const m = this.mes();
    this.mes.set(new Date(m.getFullYear(), m.getMonth() + n, 1));
  }

  elegirFecha(d: Dia): void {
    if (!d.habil) return;
    this.nFecha.set(d.fecha);
    this.nHora.set(null);
    if (!d.delMes) this.mes.set(primerDiaMes(new Date(d.fecha + 'T00:00:00')));
    if (!this.esAdmin) this.cargarHoras();
  }

  cambiarDuracion(): void {
    this.nHora.set(null);
    if (!this.esAdmin && this.nFecha()) this.cargarHoras();
  }

  private cargarHoras(): void {
    const f = this.nFecha();
    if (!f) return;
    this.cargandoHoras.set(true);
    this.agenda.misHorasLibres(f, this.nDuracion).subscribe({
      next: (h) => { this.horasLibres.set(h); this.cargandoHoras.set(false); },
      error: (e) => { this.cargandoHoras.set(false); this.horasLibres.set([]); this.errorPanel.set(e?.error?.mensaje ?? 'No se pudieron cargar las horas.'); },
    });
  }

  enviarConvocatoria(): void {
    const p = this.padreElegido();
    const hora = this.esAdmin ? this.nHoraLibre : this.nHora();
    if (!this.esAdmin && !this.aulaElegida()) { this.errorPanel.set('Selecciona el aula.'); return; }
    if (!p) { this.errorPanel.set(this.esAdmin ? 'Selecciona a la persona.' : 'Selecciona al padre o tutor.'); return; }
    if (!this.nMotivo.trim()) { this.errorPanel.set('Escribe el motivo de la cita.'); return; }
    if (this.nMotivo.trim().length < 5) { this.errorPanel.set('El motivo debe tener al menos 5 caracteres.'); return; }
    if (!this.nFecha()) { this.errorPanel.set('Elige la fecha de la cita.'); return; }
    if (!hora) { this.errorPanel.set('Elige la hora de la cita.'); return; }
    this.enviando.set(true);
    this.errorPanel.set(null);
    this.agenda.programar({
      padreId: p.id, estudianteId: p.estudianteId, fecha: this.nFecha()!, horaInicio: hora, horaFin: null,
      modalidad: 'PRESENCIAL', lugar: null, motivo: this.nMotivo.trim(), duracionMinutos: this.nDuracion,
      detalle: this.nDetalle.trim() || null,
    }).subscribe({
      next: (c) => {
        this.enviando.set(false);
        this.panelNueva.set(false);
        this.citas.update(l => [c, ...l]);
        this.toast.exito(`Convocatoria enviada a ${p.nombre}. La cita queda pendiente hasta que la acepte.`);
      },
      error: (e) => {
        this.enviando.set(false);
        this.errorPanel.set(e?.error?.mensaje ?? 'No se pudo enviar la convocatoria.');
        if (!this.esAdmin) this.cargarHoras();
      },
    });
  }

  // ================= Padre: solicitar =================

  abrirSolicitar(): void {
    this.panelSolicitar.set(true);
    this.responsable.set(null);
    this.horarios.set([]);
    this.horarioElegido.set(null);
    this.diaElegido.set(null);
    this.motivo = '';
    this.detalleCaso = '';
    this.buscarResponsable.set('');
    this.semana.set(lunesDe(hoyIso()));
    this.errorPanel.set(null);
    this.hijosService.listar().subscribe({
      next: (h) => { this.hijos.set(h); this.hijoElegido = this.hijosService.seleccionado() ?? h[0]?.id ?? null; },
    });
    this.agenda.responsables().subscribe({
      next: (r) => this.responsables.set(r),
      error: (e) => this.errorPanel.set(e?.error?.mensaje ?? 'No se pudo cargar la lista.'),
    });
  }

  elegirResponsable(r: Responsable): void {
    this.responsable.set(r);
    this.buscarResponsable.set(r.nombre);
    this.verSugerencias.set(false);
    this.errorPanel.set(null);
    this.horarioElegido.set(null);
    this.diaElegido.set(null);
    this.cargandoHorarios.set(true);
    this.agenda.horarios(r.usuarioId).subscribe({
      next: (h) => {
        this.horarios.set(h);
        this.diaElegido.set(h[0]?.fecha ?? null);
        // El calendario abre en la semana del primer horario libre.
        this.semana.set(lunesDe(h[0]?.fecha ?? hoyIso()));
        this.cargandoHorarios.set(false);
      },
      error: (e) => { this.cargandoHorarios.set(false); this.errorPanel.set(e?.error?.mensaje ?? 'No se pudieron cargar los horarios.'); },
    });
  }

  /** Al escribir en el buscador: si cambia el nombre elegido, se quita la selección (y sus horarios). */
  alEscribirResponsable(texto: string): void {
    this.buscarResponsable.set(texto);
    this.verSugerencias.set(true);
    const r = this.responsable();
    if (r && texto !== r.nombre) {
      this.responsable.set(null);
      this.horarios.set([]);
      this.horarioElegido.set(null);
    }
  }

  moverSemana(n: number): void { this.semana.set(sumarDias(this.semana(), 7 * n)); }
  semanaHoy(): void { this.semana.set(lunesDe(hoyIso())); }

  /** Fila (1-based, después de la cabecera) donde empieza un horario. */
  filaCal(h: HorarioLibre): number { return this.filasCal().indexOf(Math.floor(minutos(h.horaInicio) / 15) * 15) + 2; }
  altoCal(h: HorarioLibre): number { return Math.max(1, Math.round((minutos(h.horaFin) - minutos(h.horaInicio)) / 15)); }
  columnaCal(h: HorarioLibre): number { return this.diasSemana5().indexOf(h.fecha) + 2; }
  horaTexto(t: number): string { return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }
  esHoy(f: string): boolean { return f === this.hoy; }

  /** "Octubre 2026" del calendario. */
  mesSemana(): string {
    const d = aFecha(this.semana());
    const nombre = MESES[d.getMonth()];
    return `${nombre} ${d.getFullYear()}`;
  }

  horasDelDia(): HorarioLibre[] {
    return this.dias().find(d => d.fecha === this.diaElegido())?.horas ?? [];
  }

  diaSemana(f: string): string {
    return fechaCorta(f, true).split(' ')[0];
  }

  solicitar(): void {
    const r = this.responsable(), h = this.horarioElegido();
    if (!r) { this.errorPanel.set('Elige con quién quieres reunirte.'); return; }
    if (!h) { this.errorPanel.set('Elige un horario disponible.'); return; }
    if (!this.motivo.trim()) { this.errorPanel.set('Escribe el motivo de la reunión.'); return; }
    if (this.motivo.trim().length < 5) { this.errorPanel.set('El motivo debe tener al menos 5 caracteres.'); return; }
    if (!this.detalleCaso.trim()) { this.errorPanel.set('Explica brevemente el motivo de la convocatoria (paso 4).'); return; }
    this.enviando.set(true);
    this.agenda.solicitar({
      responsableId: r.usuarioId, estudianteId: this.hijoElegido, fecha: h.fecha, horaInicio: h.horaInicio,
      motivo: this.motivo.trim(), detalle: this.detalleCaso.trim(),
    })
      .subscribe({
        next: (c) => {
          this.enviando.set(false);
          this.panelSolicitar.set(false);
          this.citas.update(l => [c, ...l]);
          this.toast.exito(`Solicitud enviada a ${r.nombre}. Te avisaremos cuando la acepte.`);
        },
        error: (e) => {
          this.enviando.set(false);
          this.errorPanel.set(e?.error?.mensaje ?? 'No se pudo enviar la solicitud.');
          this.elegirResponsable(r);
        },
      });
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    this.detalle.set(null);
    this.cancelando.set(null);
    this.panelSolicitar.set(false);
    this.panelNueva.set(false);
  }
}

function minutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

function aFecha(iso: string): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sumarDias(iso: string, n: number): string {
  const d = aFecha(iso);
  d.setDate(d.getDate() + n);
  return aIso(d);
}

/** Lunes de la semana de la fecha (sábado y domingo pasan a la semana siguiente). */
function lunesDe(iso: string): string {
  const d = aFecha(iso);
  const dia = d.getDay();              // 0 = domingo
  const desplazamiento = dia === 0 ? 1 : dia === 6 ? 2 : 1 - dia;
  d.setDate(d.getDate() + desplazamiento);
  return aIso(d);
}

function primerDiaMes(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

function aIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dmy(iso: string): string {
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

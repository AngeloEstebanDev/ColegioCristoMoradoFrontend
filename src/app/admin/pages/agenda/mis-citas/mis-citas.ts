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

/** Tipo Filtro: describe la forma de los datos de «filtro». */
type Filtro = 'TODOS' | 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'REALIZADA';

/** Constante MESES: valor fijo (meses) que se reutiliza en varias partes. */
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Constante ESTADO: valor fijo (estado) que se reutiliza en varias partes. */
const ESTADO: Record<EstadoCita, { etiqueta: string; color: string; fondo: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#9A6B00', fondo: '#FDF1DC' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#1E7A3B', fondo: '#E7F3EA' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#A62639', fondo: '#FBE7E9' },
  RECHAZADA: { etiqueta: 'Cancelada', color: '#A62639', fondo: '#FBE7E9' },
  REALIZADA: { etiqueta: 'Realizada', color: '#2563EB', fondo: '#E6EEFB' },
};

/** Modelo Dia: describe la forma de los datos de «día». */
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
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);
  /** Servicio AuthService (inyectado por Angular). */
  private auth = inject(AuthService);
  /** Servicio AgendaService (inyectado por Angular). */
  private agenda = inject(AgendaService);
  /** Servicio HijosService (inyectado por Angular). */
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

  /** Estado (signal): citas. */
  citas = signal<Cita[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): aviso. */
  aviso = signal<string | null>(null);
  /** Estado (signal): filtro. */
  filtro = signal<Filtro>('TODOS');

  /** Valor calculado (computed): totales. Se actualiza solo. */
  totales = computed(() => {
    const l = this.citas();
    return {
      total: l.length,
      pendientes: l.filter(c => c.estado === 'PENDIENTE').length,
      confirmadas: l.filter(c => c.estado === 'CONFIRMADA').length,
      canceladas: l.filter(c => c.estado === 'CANCELADA' || c.estado === 'RECHAZADA').length,
    };
  });

  /** Valor calculado (computed): lista. Se actualiza solo. */
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
  /** Estado (signal): cancelando. */
  cancelando = signal<Cita | null>(null);
  motivoCancelacion = '';
  /** Estado (signal): procesando. */
  procesando = signal(false);
  /** Estado (signal): error acción. */
  errorAccion = signal<string | null>(null);

  // ---- Nueva cita (docente / administración)
  panelNueva = signal(false);
  /** Estado (signal): padres. */
  padres = signal<PadreContacto[]>([]);
  /** Estado (signal): personas. */
  personas = signal<PersonaCita[]>([]);
  /** Estado (signal): aula elegida. */
  aulaElegida = signal<string>('');
  /** Estado (signal): buscar. */
  buscar = signal('');
  /** Estado (signal): padre elegido. */
  padreElegido = signal<{ id: number; nombre: string; detalle: string; estudianteId: number | null } | null>(null);
  nMotivo = '';
  nDuracion = 30;
  nDetalle = '';
  /** Estado (signal): n fecha. */
  nFecha = signal<string | null>(null);
  /** Estado (signal): n hora. */
  nHora = signal<string | null>(null);
  nHoraLibre = '';
  /** Estado (signal): horas libres. */
  horasLibres = signal<string[]>([]);
  /** Estado (signal): cargando horas. */
  cargandoHoras = signal(false);
  /** Estado (signal): días disponibles. */
  diasDisponibles = signal<Set<number>>(new Set());
  /** Estado (signal): mes. */
  mes = signal(primerDiaMes(new Date()));
  /** Estado (signal): error panel. */
  errorPanel = signal<string | null>(null);
  /** Estado (signal): enviando. */
  enviando = signal(false);

  /** Valor calculado (computed): aulas. Se actualiza solo. */
  aulas = computed(() => [...new Set(this.padres().flatMap(p => p.hijos.map(h => h.salon)))].sort());
  /** Valor calculado (computed): candidatos. Se actualiza solo. */
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
  /** Valor calculado (computed): título mes. Se actualiza solo. */
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
  /** Estado (signal): hijos. */
  hijos = signal<Hijo[]>([]);
  /** Estado (signal): responsables. */
  responsables = signal<Responsable[]>([]);
  /** Estado (signal): responsable. */
  responsable = signal<Responsable | null>(null);
  /** Estado (signal): horarios. */
  horarios = signal<HorarioLibre[]>([]);
  /** Estado (signal): cargando horarios. */
  cargandoHorarios = signal(false);
  /** Estado (signal): horario elegido. */
  horarioElegido = signal<HorarioLibre | null>(null);
  hijoElegido: number | null = null;
  motivo = '';
  /** Valor calculado (computed): días. Se actualiza solo. */
  dias = computed(() => {
    const mapa = new Map<string, HorarioLibre[]>();
    this.horarios().forEach(h => mapa.set(h.fecha, [...(mapa.get(h.fecha) ?? []), h]));
    return [...mapa.entries()].map(([fecha, horas]) => ({ fecha, horas }));
  });
  /** Estado (signal): día elegido. */
  diaElegido = signal<string | null>(null);
  /** Descripción del caso (paso 4). */
  detalleCaso = '';
  /** Estado (signal): buscar responsable. */
  buscarResponsable = signal('');
  /** Estado (signal): ver sugerencias. */
  verSugerencias = signal(false);
  /** Lunes de la semana que se ve en el calendario (yyyy-MM-dd). */
  semana = signal<string>(lunesDe(hoyIso()));

  /** Valor calculado (computed): responsables filtrados. Se actualiza solo. */
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

  /** Valor calculado (computed): hay antes. Se actualiza solo. */
  hayAntes = computed(() => this.horarios().some(h => h.fecha < this.semana()));
  /** Valor calculado (computed): hay despues. Se actualiza solo. */
  hayDespues = computed(() => this.horarios().some(h => h.fecha > sumarDias(this.semana(), 6)));

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void {
    this.cargar();
  }

  /**
   * Carga los datos de esta pantalla. Pide los datos al backend con agenda.citas() y actualiza la
   * pantalla cuando llega la respuesta.
   */
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

  /** Devuelve la fecha de hora. */
  fechaHora(c: Cita): string { return `${dmy(c.fecha)} ${c.horaInicio}`; }

  /** Indica si es cancelada (devuelve verdadero o falso). */
  esCancelada(c: Cita): boolean { return c.estado === 'CANCELADA' || c.estado === 'RECHAZADA'; }

  /** Actualiza los datos de esta pantalla. Muestra un aviso (toast) con el resultado. */
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

  /** Abre cancelar. */
  abrirCancelar(c: Cita): void {
    this.cancelando.set(c);
    this.motivoCancelacion = '';
    this.errorAccion.set(null);
  }

  /**
   * Cancela los datos de esta pantalla. Pide los datos al backend con agenda.cancelar() y actualiza la
   * pantalla cuando llega la respuesta.
   */
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

  /**
   * Elimina los datos de esta pantalla. Pide los datos al backend con agenda.eliminar() y actualiza la
   * pantalla cuando llega la respuesta. Muestra un aviso (toast) con el resultado. Antes pide
   * confirmación al usuario.
   */
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

  /** Elige aula. */
  elegirAula(a: string): void {
    this.aulaElegida.set(a);
    this.padreElegido.set(null);
    this.buscar.set('');
  }

  /** Mueve mes. */
  moverMes(n: number): void {
    const m = this.mes();
    this.mes.set(new Date(m.getFullYear(), m.getMonth() + n, 1));
  }

  /** Elige fecha. */
  elegirFecha(d: Dia): void {
    if (!d.habil) return;
    this.nFecha.set(d.fecha);
    this.nHora.set(null);
    if (!d.delMes) this.mes.set(primerDiaMes(new Date(d.fecha + 'T00:00:00')));
    if (!this.esAdmin) this.cargarHoras();
  }

  /** Cambia duracion. */
  cambiarDuracion(): void {
    this.nHora.set(null);
    if (!this.esAdmin && this.nFecha()) this.cargarHoras();
  }

  /**
   * Carga horas. Pide los datos al backend con agenda.misHorasLibres() y actualiza la pantalla cuando
   * llega la respuesta.
   */
  private cargarHoras(): void {
    const f = this.nFecha();
    if (!f) return;
    this.cargandoHoras.set(true);
    this.agenda.misHorasLibres(f, this.nDuracion).subscribe({
      next: (h) => { this.horasLibres.set(h); this.cargandoHoras.set(false); },
      error: (e) => { this.cargandoHoras.set(false); this.horasLibres.set([]); this.errorPanel.set(e?.error?.mensaje ?? 'No se pudieron cargar las horas.'); },
    });
  }

  /** Envía convocatoria. Muestra un aviso (toast) con el resultado. */
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

  /**
   * Elige responsable. Pide los datos al backend con agenda.horarios() y actualiza la pantalla cuando
   * llega la respuesta.
   */
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

  /** Mueve semana. */
  moverSemana(n: number): void { this.semana.set(sumarDias(this.semana(), 7 * n)); }
  /** Realiza la acción «semana hoy» de esta pantalla. */
  semanaHoy(): void { this.semana.set(lunesDe(hoyIso())); }

  /** Fila (1-based, después de la cabecera) donde empieza un horario. */
  filaCal(h: HorarioLibre): number { return this.filasCal().indexOf(Math.floor(minutos(h.horaInicio) / 15) * 15) + 2; }
  /** Calcula «alto cal» (devuelve un número). */
  altoCal(h: HorarioLibre): number { return Math.max(1, Math.round((minutos(h.horaFin) - minutos(h.horaInicio)) / 15)); }
  /** Calcula «columna cal» (devuelve un número). */
  columnaCal(h: HorarioLibre): number { return this.diasSemana5().indexOf(h.fecha) + 2; }
  /** Devuelve la hora de texto. */
  horaTexto(t: number): string { return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }
  /** Indica si es hoy (devuelve verdadero o falso). */
  esHoy(f: string): boolean { return f === this.hoy; }

  /** "Octubre 2026" del calendario. */
  mesSemana(): string {
    const d = aFecha(this.semana());
    const nombre = MESES[d.getMonth()];
    return `${nombre} ${d.getFullYear()}`;
  }

  /** Devuelve «horas del día». */
  horasDelDia(): HorarioLibre[] {
    return this.dias().find(d => d.fecha === this.diaElegido())?.horas ?? [];
  }

  /** Devuelve el texto de «día semana». */
  diaSemana(f: string): string {
    return fechaCorta(f, true).split(' ')[0];
  }

  /** Solicita los datos de esta pantalla. Muestra un aviso (toast) con el resultado. */
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

  /** Se ejecuta al presionar la tecla Esc: cierra la ventana o el menú que esté abierto. */
  @HostListener('document:keydown.escape')
  escape(): void {
    this.detalle.set(null);
    this.cancelando.set(null);
    this.panelSolicitar.set(false);
    this.panelNueva.set(false);
  }
}

/** Función minutos: minutos. */
function minutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

/** Convierte el valor a fecha. */
function aFecha(iso: string): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Suma días. */
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

/** Función primerDiaMes: primer día mes. */
function primerDiaMes(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

/** Convierte el valor a iso. */
function aIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Función dmy: dmy. */
function dmy(iso: string): string {
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

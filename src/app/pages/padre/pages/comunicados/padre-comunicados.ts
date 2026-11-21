import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../../../services/auth';
import { ComunicadoService } from '../../../../core/services/comunicado.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Comunicado, etiquetaGrupo } from '../../../../core/models/comunicado.model';
import { Borrador, Contacto, Mensaje } from '../../../../core/models/mensaje.model';
import { haceCuanto, iniciales, textoPlano } from '../../../../core/utils/texto';
import { EditorTexto } from '../../../../shared/components/editor-texto/editor-texto';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

/** Tipo Pestana: describe la forma de los datos de «pestaña». */
type Pestana = 'comunicados' | 'mensajes';
/** Tipo FiltroComunicado: describe la forma de los datos de «filtro comunicado». */
type FiltroComunicado = 'TODOS' | 'LEIDOS' | 'NO_LEIDOS';
/** Tipo Bandeja: describe la forma de los datos de «bandeja». */
type Bandeja = 'RECIBIDOS' | 'ENVIADOS' | 'BORRADORES';

/** Fila de la lista de mensajes (recibido, enviado o borrador). */
interface FilaMensaje {
  clave: string;
  bandeja: Bandeja;
  nombre: string;          // con quién (remitente o destinatario)
  usuarioId?: number | null; // para la foto de perfil
  rol: string;
  asunto: string;
  vista: string;           // texto plano para la vista previa
  fecha: string;
  noLeido: boolean;
  mensaje?: Mensaje;
  borrador?: Borrador;
}

/** Constante MESES: valor fijo (meses) que se reutiliza en varias partes. */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Padre > Comunicados.
 * - Comunicados: solo lectura (buscar, filtrar por año y por leídos / no leídos, ver el detalle).
 * - Mensajes: bandeja Recibidos / Enviados / Borradores. El padre escribe a los profesores
 *   de sus hijos y a la administración, responde lo que recibe y puede guardar borradores.
 */
@Component({
  selector: 'app-padre-comunicados',
  standalone: true,
  imports: [FotoUsuario, CommonModule, FormsModule, EditorTexto],
  templateUrl: './padre-comunicados.html',
})
export class PadreComunicados implements OnInit {
  /** Servicio AuthService (inyectado por Angular). */
  private auth = inject(AuthService);
  /** Servicio ActivatedRoute (inyectado por Angular). */
  private route = inject(ActivatedRoute);
  /** Servicio Router (inyectado por Angular). */
  private router = inject(Router);
  /** Servicio ComunicadoService (inyectado por Angular). */
  private comunicadoService = inject(ComunicadoService);
  /** Servicio MensajeService (inyectado por Angular). */
  private mensajeService = inject(MensajeService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio NotificacionService (inyectado por Angular). */
  readonly notificaciones = inject(NotificacionService);

  readonly iniciales = iniciales;
  readonly haceCuanto = haceCuanto;
  readonly yo = this.auth.obtenerUsuario()?.id ?? 0;
  readonly anioActual = new Date().getFullYear();

  /** Estado (signal): pestaña. */
  pestana = signal<Pestana>('comunicados');

  // ---------------- Comunicados ----------------
  comunicados = signal<Comunicado[]>([]);
  /** Estado (signal): cargando comunicados. */
  cargandoComunicados = signal(true);
  /** Estado (signal): error comunicados. */
  errorComunicados = signal<string | null>(null);
  /** Estado (signal): buscar comunicado. */
  buscarComunicado = signal('');
  /** Estado (signal): año comunicado. */
  anioComunicado = signal<number | 0>(this.anioActual);   // 0 = todos los años
  /** Estado (signal): filtro comunicado. */
  filtroComunicado = signal<FiltroComunicado>('TODOS');
  /** Estado (signal): detalle. */
  detalle = signal<Comunicado | null>(null);

  /** Valor calculado (computed): anios comunicados. Se actualiza solo. */
  aniosComunicados = computed(() => this.anios(this.comunicados().map(c => c.fechaCreacion)));
  /** Valor calculado (computed): comunicados filtrados. Se actualiza solo. */
  comunicadosFiltrados = computed(() => {
    const t = this.buscarComunicado().toLowerCase().trim();
    const anio = this.anioComunicado();
    const f = this.filtroComunicado();
    return this.comunicados()
      .filter(c => !anio || new Date(c.fechaCreacion).getFullYear() === anio)
      .filter(c => f === 'TODOS' || (f === 'LEIDOS' ? c.leido : !c.leido))
      .filter(c => !t || c.titulo.toLowerCase().includes(t) || textoPlano(c.contenido).toLowerCase().includes(t)
        || (c.autorNombre ?? '').toLowerCase().includes(t))
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
  });

  // ---------------- Mensajes ----------------
  recibidos = signal<Mensaje[]>([]);
  /** Estado (signal): enviados. */
  enviados = signal<Mensaje[]>([]);
  /** Estado (signal): borradores. */
  borradores = signal<Borrador[]>([]);
  /** Estado (signal): contactos. */
  contactos = signal<Contacto[]>([]);
  /** Estado (signal): cargando mensajes. */
  cargandoMensajes = signal(false);
  mensajesCargados = false;
  /** Estado (signal): error mensajes. */
  errorMensajes = signal<string | null>(null);
  /** Estado (signal): bandeja. */
  bandeja = signal<Bandeja>('RECIBIDOS');
  /** Estado (signal): buscar mensaje. */
  buscarMensaje = signal('');
  /** Estado (signal): año mensaje. */
  anioMensaje = signal<number | 0>(this.anioActual);
  /** Estado (signal): leyendo. */
  leyendo = signal<Mensaje | null>(null);

  /** Valor calculado (computed): anios mensajes. Se actualiza solo. */
  aniosMensajes = computed(() => this.anios([
    ...this.recibidos().map(m => m.fechaEnvio), ...this.enviados().map(m => m.fechaEnvio), ...this.borradores().map(b => b.fecha),
  ]));

  filas = computed<FilaMensaje[]>(() => {
    const b = this.bandeja();
    let filas: FilaMensaje[];
    if (b === 'RECIBIDOS') {
      filas = this.recibidos().map(m => ({
        clave: 'r' + m.id, bandeja: b, nombre: m.remitente.nombre, usuarioId: m.remitente.usuarioId, rol: m.remitente.rol,
        asunto: this.asunto(m.asunto), vista: textoPlano(m.contenido), fecha: m.fechaEnvio, noLeido: !m.leido, mensaje: m,
      }));
    } else if (b === 'ENVIADOS') {
      filas = this.enviados().map(m => ({
        clave: 'e' + m.id, bandeja: b, nombre: m.destinatarios.map(d => d.nombre).join(', ') || '—', usuarioId: m.destinatarios[0]?.usuarioId, rol: m.destinatarios[0]?.rol ?? '',
        asunto: this.asunto(m.asunto), vista: textoPlano(m.contenido), fecha: m.fechaEnvio, noLeido: false, mensaje: m,
      }));
    } else {
      filas = this.borradores().map(d => ({
        clave: 'b' + d.id, bandeja: b, nombre: d.destinatarioNombre ?? 'Sin destinatario', usuarioId: d.destinatarioId, rol: d.destinatarioRol ?? '',
        asunto: d.asunto || '(Sin asunto)', vista: textoPlano(d.contenido) || 'Borrador vacío', fecha: d.fecha, noLeido: false, borrador: d,
      }));
    }
    const t = this.buscarMensaje().toLowerCase().trim();
    const anio = this.anioMensaje();
    return filas
      .filter(f => !anio || new Date(f.fecha).getFullYear() === anio)
      .filter(f => !t || f.nombre.toLowerCase().includes(t) || f.asunto.toLowerCase().includes(t) || f.vista.toLowerCase().includes(t))
      .sort((x, y) => y.fecha.localeCompare(x.fecha));
  });

  /** Valor calculado (computed): no leidos recibidos. Se actualiza solo. */
  noLeidosRecibidos = computed(() => this.recibidos().filter(m => !m.leido).length);

  // ---------------- Redactar ----------------
  redactando = signal(false);
  /** Estado (signal): buscar destino. */
  buscarDestino = signal('');
  /** Estado (signal): destino. */
  destino = signal<Contacto | null>(null);
  asuntoNuevo = '';
  contenidoNuevo = '';
  respuestaAId: number | null = null;
  borradorId: number | null = null;
  /** Estado (signal): enviando. */
  enviando = signal(false);
  /** Estado (signal): error redactar. */
  errorRedactar = signal<string | null>(null);

  /** Valor calculado (computed): contactos filtrados. Se actualiza solo. */
  contactosFiltrados = computed(() => {
    const t = this.buscarDestino().toLowerCase().trim();
    return this.contactos()
      .filter(c => !t || c.nombre.toLowerCase().includes(t) || c.detalle.toLowerCase().includes(t) || this.etiquetaRol(c.rol).toLowerCase().includes(t))
      .sort((a, b) => (a.rol === 'Docente' ? 0 : 1) - (b.rol === 'Docente' ? 0 : 1) || a.nombre.localeCompare(b.nombre));
  });

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void {
    this.cargarComunicados();
    this.route.queryParamMap.subscribe(q => {
      const tab = q.get('tab');
      if (tab === 'mensajes') this.abrirMensajes();
      else if (tab === 'comunicados') this.pestana.set('comunicados');
      // ?para=ID abre "Crear nuevo mensaje" con ese destinatario (p. ej. desde un curso de su hijo).
      const para = Number(q.get('para'));
      if (para) this.redactarA(para);
    });
    this.notificaciones.refrescar();
  }

  /** Cambia pestaña. Al terminar, lleva al usuario a otra página (router.navigate). */
  cambiarPestana(p: Pestana): void {
    if (p === 'mensajes') this.abrirMensajes(); else this.pestana.set(p);
    this.router.navigate([], { queryParams: { tab: p === 'comunicados' ? null : p, para: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** Abre mensajes. */
  private abrirMensajes(): void {
    this.pestana.set('mensajes');
    if (!this.mensajesCargados) this.cargarMensajes();
  }

  // ======================= Comunicados =======================

  private cargarComunicados(): void {
    this.cargandoComunicados.set(true);
    this.comunicadoService.listar(this.yo).subscribe({
      next: (c) => { this.comunicados.set(c); this.cargandoComunicados.set(false); },
      error: (e) => { this.cargandoComunicados.set(false); this.errorComunicados.set(e?.error?.mensaje ?? 'No se pudieron cargar los comunicados.'); },
    });
  }

  /**
   * Muestra comunicado. Pide los datos al backend con comunicadoService.marcarLeido() y actualiza la
   * pantalla cuando llega la respuesta.
   */
  verComunicado(c: Comunicado): void {
    this.detalle.set(c);
    if (!c.leido) {
      this.comunicadoService.marcarLeido(c.id, this.yo).subscribe({
        next: () => {
          this.comunicados.update(l => l.map(x => x.id === c.id ? { ...x, leido: true } : x));
          this.notificaciones.refrescar();
        },
        error: () => { /* se marcará la próxima vez */ },
      });
    }
  }

  /** "Prof. María Castro" para docentes; "Nombre (Administración)" para el resto. */
  autor(c: Comunicado): string {
    const nombre = c.autorNombre || 'Colegio';
    if ((c.autorRol ?? '').toLowerCase().includes('docente')) return 'Prof. ' + nombre;
    return c.autorRol && c.autorRol !== 'Docente' ? `${nombre} (${c.autorRol})` : nombre;
  }

  /** Devuelve el texto de «vista previa». */
  vistaPrevia(c: Comunicado): string { return textoPlano(c.contenido); }

  /** Devuelve el texto de «dirigido a». */
  dirigidoA(c: Comunicado): string {
    const grupos = c.destinatarios.map(etiquetaGrupo).join(', ');
    return c.secciones.length ? `${grupos} – ${c.secciones.join(', ')}` : grupos;
  }

  /** "22 de septiembre de 2026, 10:30" */
  fechaLarga(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ======================= Mensajes =======================

  cargarMensajes(): void {
    this.cargandoMensajes.set(true);
    this.errorMensajes.set(null);
    forkJoin({
      r: this.mensajeService.recibidos(this.yo),
      e: this.mensajeService.enviados(this.yo),
      b: this.mensajeService.borradores(this.yo).pipe(catchError(() => of([] as Borrador[]))),
    }).subscribe({
      next: ({ r, e, b }) => {
        this.recibidos.set(r); this.enviados.set(e); this.borradores.set(b);
        this.mensajesCargados = true;
        this.cargandoMensajes.set(false);
      },
      error: (err) => { this.cargandoMensajes.set(false); this.errorMensajes.set(err?.error?.mensaje ?? 'No se pudieron cargar tus mensajes.'); },
    });
  }

  /**
   * Carga contactos. Pide los datos al backend con mensajeService.contactos() y actualiza la pantalla
   * cuando llega la respuesta.
   */
  private cargarContactos(): Promise<void> {
    if (this.contactos().length) return Promise.resolve();
    return new Promise(res => this.mensajeService.contactos(this.yo).subscribe({
      next: (c) => { this.contactos.set(c.contactos.filter(x => x.rol === 'Docente' || x.rol === 'Administración')); res(); },
      error: () => res(),
    }));
  }

  /** Los chats antiguos se guardan con el asunto "Chat": se muestran sin asunto. */
  asunto(a: string | null | undefined): string {
    return !a || a === 'Chat' ? '(Sin asunto)' : a;
  }

  /** Devuelve la etiqueta de rol. */
  etiquetaRol(rol: string | null | undefined): string {
    if (rol === 'Docente') return 'Profesor';
    return rol || '';
  }

  /**
   * Abre fila. Pide los datos al backend con mensajeService.marcarLeido() y actualiza la pantalla
   * cuando llega la respuesta.
   */
  abrirFila(f: FilaMensaje): void {
    if (f.borrador) { this.editarBorrador(f.borrador); return; }
    const m = f.mensaje!;
    this.leyendo.set(m);
    if (f.bandeja === 'RECIBIDOS' && !m.leido) {
      this.mensajeService.marcarLeido(m.id, this.yo).subscribe({
        next: () => {
          this.recibidos.update(l => l.map(x => x.id === m.id ? { ...x, leido: true } : x));
          this.notificaciones.refrescar();
        },
        error: () => {},
      });
    }
  }

  /** Indica si puede responder (devuelve verdadero o falso). */
  puedeResponder(m: Mensaje | null | undefined): boolean {
    return !!m && m.bandeja === 'RECIBIDO' && !!m.remitente.usuarioId;
  }

  /**
   * Elimina fila. Muestra un aviso (toast) con el resultado. Antes pide confirmación al usuario.
   */
  async eliminarFila(f: FilaMensaje, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    const ok = await this.confirmar.pedir(
      f.borrador ? '¿Eliminar este borrador?' : 'Se quitará de tu bandeja. La otra persona lo seguirá viendo.',
      { titulo: f.borrador ? 'Eliminar borrador' : 'Eliminar mensaje', aceptar: 'Eliminar', peligro: true });
    if (!ok) return;
    const op = f.borrador ? this.mensajeService.eliminarBorrador(f.borrador.id, this.yo) : this.mensajeService.eliminar(f.mensaje!.id, this.yo);
    op.subscribe({
      next: () => {
        if (f.borrador) this.borradores.update(l => l.filter(x => x.id !== f.borrador!.id));
        else if (f.bandeja === 'RECIBIDOS') this.recibidos.update(l => l.filter(x => x.id !== f.mensaje!.id));
        else this.enviados.update(l => l.filter(x => x.id !== f.mensaje!.id));
        if (this.leyendo()?.id === f.mensaje?.id) this.leyendo.set(null);
        this.notificaciones.refrescar();
        this.toast.exito(f.borrador ? 'Borrador eliminado.' : 'Mensaje eliminado.');
      },
      error: (e) => this.toast.error(e?.error?.mensaje ?? 'No se pudo eliminar.'),
    });
  }

  /** Elimina leyendo. */
  eliminarLeyendo(): void {
    const m = this.leyendo();
    if (!m) return;
    this.eliminarFila({
      clave: '', bandeja: m.bandeja === 'RECIBIDO' ? 'RECIBIDOS' : 'ENVIADOS', nombre: '', rol: '', asunto: '', vista: '', fecha: '', noLeido: false, mensaje: m,
    });
  }

  // ---------------- Redactar ----------------

  async nuevoMensaje(): Promise<void> {
    this.limpiarRedaccion();
    this.redactando.set(true);
    await this.cargarContactos();
  }

  /** Abre "Crear nuevo mensaje" con un destinatario elegido (si es uno de sus contactos). */
  private async redactarA(usuarioId: number): Promise<void> {
    this.abrirMensajes();
    this.limpiarRedaccion();
    await this.cargarContactos();
    const c = this.contactos().find(x => x.usuarioId === usuarioId) ?? null;
    if (!c) { this.toast.aviso('No puedes escribirle a esa persona desde aquí.'); return; }
    this.destino.set(c);
    this.redactando.set(true);
  }

  /** Responde los datos de esta pantalla. */
  async responder(m: Mensaje): Promise<void> {
    this.leyendo.set(null);
    this.limpiarRedaccion();
    await this.cargarContactos();
    const r = m.remitente;
    this.destino.set(this.contactos().find(x => x.usuarioId === r.usuarioId)
      ?? { usuarioId: r.usuarioId!, nombre: r.nombre, rol: r.rol, detalle: '' });
    const a = this.asunto(m.asunto);
    this.asuntoNuevo = a === '(Sin asunto)' ? '' : (a.toLowerCase().startsWith('re:') ? a : 'Re: ' + a);
    this.respuestaAId = m.id;
    this.redactando.set(true);
  }

  /** Edita borrador. */
  async editarBorrador(b: Borrador): Promise<void> {
    this.limpiarRedaccion();
    await this.cargarContactos();
    this.borradorId = b.id;
    this.asuntoNuevo = b.asunto;
    this.contenidoNuevo = b.contenido;
    this.respuestaAId = b.respuestaAId;
    if (b.destinatarioId) {
      this.destino.set(this.contactos().find(x => x.usuarioId === b.destinatarioId)
        ?? { usuarioId: b.destinatarioId, nombre: b.destinatarioNombre ?? '', rol: b.destinatarioRol ?? '', detalle: '' });
    }
    this.redactando.set(true);
  }

  /** Limpia redaccion. */
  private limpiarRedaccion(): void {
    this.destino.set(null);
    this.buscarDestino.set('');
    this.asuntoNuevo = '';
    this.contenidoNuevo = '';
    this.respuestaAId = null;
    this.borradorId = null;
    this.errorRedactar.set(null);
  }

  /** Indica si tiene contenido (devuelve verdadero o falso). */
  private tieneContenido(): boolean {
    return !!this.asuntoNuevo.trim() || !!textoPlano(this.contenidoNuevo).trim();
  }

  /**
   * Envía los datos de esta pantalla. Pide los datos al backend con mensajeService.eliminarBorrador()
   * y actualiza la pantalla cuando llega la respuesta. Muestra un aviso (toast) con el resultado.
   */
  enviar(): void {
    const d = this.destino();
    if (!d) { this.errorRedactar.set('Elige a quién le escribes.'); return; }
    if (!textoPlano(this.contenidoNuevo).trim()) { this.errorRedactar.set('Escribe el mensaje antes de enviarlo.'); return; }
    if (this.asuntoNuevo.trim().length > 200) { this.errorRedactar.set('El asunto no puede superar los 200 caracteres.'); return; }
    this.enviando.set(true);
    this.errorRedactar.set(null);
    this.mensajeService.enviar(this.yo, {
      destinatariosIds: [d.usuarioId], asunto: this.asuntoNuevo.trim(), contenido: this.contenidoNuevo, respuestaAId: this.respuestaAId,
    }).subscribe({
      next: (m) => {
        this.enviados.update(l => [m, ...l]);
        const id = this.borradorId;
        if (id) {
          this.mensajeService.eliminarBorrador(id, this.yo).subscribe({ next: () => {}, error: () => {} });
          this.borradores.update(l => l.filter(x => x.id !== id));
        }
        this.enviando.set(false);
        this.redactando.set(false);
        this.limpiarRedaccion();
        this.toast.exito('Mensaje enviado.');
      },
      error: (e) => { this.enviando.set(false); this.errorRedactar.set(e?.error?.mensaje ?? 'No se pudo enviar el mensaje.'); },
    });
  }

  /** Guarda borrador. Muestra un aviso (toast) con el resultado. */
  guardarBorrador(cerrar = true): void {
    if (!this.tieneContenido() && !this.destino()) { this.errorRedactar.set('Escribe algo antes de guardar el borrador.'); return; }
    this.enviando.set(true);
    this.mensajeService.guardarBorrador(this.yo, {
      id: this.borradorId, destinatarioId: this.destino()?.usuarioId ?? null,
      asunto: this.asuntoNuevo.trim(), contenido: this.contenidoNuevo, respuestaAId: this.respuestaAId,
    }).subscribe({
      next: (b) => {
        this.borradores.update(l => [b, ...l.filter(x => x.id !== b.id)]);
        this.borradorId = b.id;
        this.enviando.set(false);
        this.toast.exito('Borrador guardado.');
        if (cerrar) { this.redactando.set(false); this.limpiarRedaccion(); }
      },
      error: (e) => { this.enviando.set(false); this.errorRedactar.set(e?.error?.mensaje ?? 'No se pudo guardar el borrador.'); },
    });
  }

  /** Cancela redaccion. Antes pide confirmación al usuario. */
  async cancelarRedaccion(): Promise<void> {
    if (this.tieneContenido()) {
      const guardar = await this.confirmar.pedir('¿Quieres guardar lo que escribiste como borrador?',
        { titulo: 'Mensaje sin enviar', aceptar: 'Guardar borrador', cancelar: 'Descartar' });
      if (guardar) { this.guardarBorrador(true); return; }
    }
    this.redactando.set(false);
    this.limpiarRedaccion();
  }

  // ---------------- Utilidades ----------------

  private anios(fechas: string[]): number[] {
    const s = new Set<number>([this.anioActual]);
    for (const f of fechas) if (f) s.add(new Date(f).getFullYear());
    return [...s].sort((a, b) => b - a);
  }

  /** Se ejecuta al presionar la tecla Esc: cierra la ventana o el menú que esté abierto. */
  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.redactando()) return;      // el borrador se cierra con sus botones
    this.detalle.set(null);
    this.leyendo.set(null);
  }
}

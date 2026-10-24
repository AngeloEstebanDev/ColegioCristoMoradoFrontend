import { Component, DestroyRef, ElementRef, HostListener, Injector, OnInit, ViewChild, afterNextRender, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { CHAT_AVISOS, Chat, Contacto, Contactos, Conversacion, MensajeChat } from '../../../../core/models/mensaje.model';
import { iniciales } from '../../../../core/utils/texto';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

/** Grupo de burbujas de un mismo día. */
interface Dia { etiqueta: string; mensajes: MensajeChat[]; }

const MAX_CHAT = 2000;
/** Cada cuánto se buscan mensajes nuevos (ms). */
const REFRESCO = 15000;

/**
 * Mensajería tipo chat: una conversación por persona.
 * - Izquierda: lista de chats (último mensaje y no leídos).
 * - Derecha: las burbujas y el campo para escribir.
 * - "Avisos del colegio": mensajes automáticos (p. ej. cambio de horario); no se responden.
 */
@Component({
  selector: 'app-bandeja-mensajes',
  standalone: true,
  imports: [FotoUsuario, CommonModule, FormsModule, RouterLink],
  templateUrl: './bandeja-mensajes.html',
})
export class BandejaMensajes implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private auth = inject(AuthService);
  private mensajeService = inject(MensajeService);
  private notificaciones = inject(NotificacionService);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  readonly iniciales = iniciales;
  readonly AVISOS = CHAT_AVISOS;
  readonly MAX = MAX_CHAT;

  private usuario = this.auth.obtenerUsuario();
  readonly esAlumno = ['alumno', 'estudiante'].includes((this.usuario?.rol ?? '').toLowerCase());

  conversaciones = signal<Conversacion[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  /** Chat abierto. */
  abierto = signal<Chat | null>(null);
  abiertoId = signal<number | null>(null);
  cargandoChat = signal(false);
  texto = signal('');
  enviando = signal(false);
  errorChat = signal<string | null>(null);
  menuAbierto = signal(false);

  // ---- Nuevo chat ----
  modalNuevo = signal(false);
  contactos = signal<Contactos | null>(null);
  filtroContacto = signal('');
  errorModal = signal<string | null>(null);
  aviso = signal<string | null>(null);

  @ViewChild('zonaMensajes') zonaMensajes?: ElementRef<HTMLDivElement>;
  @ViewChild('campo') campo?: ElementRef<HTMLTextAreaElement>;

  filtradas = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    if (!t) return this.conversaciones();
    return this.conversaciones().filter(c =>
      c.nombre.toLowerCase().includes(t) || c.rol.toLowerCase().includes(t)
      || (c.detalle ?? '').toLowerCase().includes(t) || c.ultimoMensaje.toLowerCase().includes(t));
  });

  /** Burbujas agrupadas por día ("Hoy", "Ayer", "lunes 21 de septiembre"). */
  dias = computed<Dia[]>(() => {
    const res: Dia[] = [];
    for (const m of this.abierto()?.mensajes ?? []) {
      const etiqueta = this.etiquetaDia(m.fecha);
      const ultimo = res[res.length - 1];
      if (ultimo?.etiqueta === etiqueta) ultimo.mensajes.push(m);
      else res.push({ etiqueta, mensajes: [m] });
    }
    return res;
  });

  /** Contactos que coinciden con la búsqueda del modal "Nuevo chat". */
  contactosFiltrados = computed(() => {
    const c = this.contactos();
    if (!c) return { personas: [] as Contacto[] };
    const t = this.filtroContacto().toLowerCase().trim();
    const coincide = (...campos: string[]) => !t || campos.some(x => (x ?? '').toLowerCase().includes(t));
    return {
      personas: c.contactos.filter(p => coincide(p.nombre, p.rol, p.detalle)),
    };
  });

  ngOnInit(): void {
    this.cargarLista();
    // ?chat=<usuarioId> abre directamente la conversación (p. ej. "Enviar mensaje" al docente desde Mis Cursos).
    const chat = Number(this.route.snapshot.queryParamMap.get('chat'));
    if (chat > 0) this.abrir(chat);
    const id = setInterval(() => this.refrescar(), REFRESCO);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  // ---------------- Lista de chats ----------------

  cargarLista(silencioso = false): void {
    if (!this.usuario) return;
    if (!silencioso) this.cargando.set(true);
    this.mensajeService.conversaciones(this.usuario.id).subscribe({
      next: (l) => {
        this.conversaciones.set(l);
        this.cargando.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.cargando.set(false);
        if (silencioso) return;
        // status 0 = el backend no responde; si responde con error, se muestra su mensaje.
        this.error.set(err?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.'
          : (err?.error?.mensaje ?? 'Ocurrió un error al cargar tus chats.'));
      },
    });
  }

  /** Busca mensajes nuevos sin interrumpir lo que se está escribiendo. */
  private refrescar(): void {
    if (document.hidden) return;
    this.cargarLista(true);
    const id = this.abiertoId();
    if (id !== null && this.usuario && !this.enviando()) {
      this.mensajeService.conversacion(id, this.usuario.id).subscribe({
        next: (c) => {
          const antes = this.abierto()?.mensajes.length ?? 0;
          if (this.abiertoId() !== id) return;
          this.abierto.set(c);
          if (c.mensajes.length !== antes) { this.bajar(); this.notificaciones.refrescar(); }
        },
      });
    }
  }

  // ---------------- Chat abierto ----------------

  abrir(id: number, previo?: Conversacion): void {
    if (!this.usuario) return;
    this.abiertoId.set(id);
    this.menuAbierto.set(false);
    this.errorChat.set(null);
    this.texto.set('');
    // Mientras carga se muestra la cabecera (si ya la tenemos).
    this.abierto.set(previo ? { conversacion: previo, mensajes: [] } : null);
    this.cargandoChat.set(true);
    this.mensajeService.conversacion(id, this.usuario.id).subscribe({
      next: (c) => {
        if (this.abiertoId() !== id) return;
        this.abierto.set(c);
        this.cargandoChat.set(false);
        // Ya están leídos: se limpia el contador de la lista y de la campana.
        this.conversaciones.update(l => l.map(x => x.id === id ? { ...x, noLeidos: 0 } : x));
        this.notificaciones.refrescar();
        this.bajar();
        if (c.conversacion.puedeEscribir) this.enfocar();
      },
      error: (err) => {
        this.cargandoChat.set(false);
        this.errorChat.set(err?.error?.mensaje ?? 'No se pudo abrir el chat.');
      },
    });
  }

  cerrarChat(): void {
    this.abiertoId.set(null);
    this.abierto.set(null);
    this.menuAbierto.set(false);
  }

  /** Enter envía; Shift + Enter hace un salto de línea. */
  teclaCampo(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.enviar();
    }
  }

  ajustarAlto(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  enviar(): void {
    const chat = this.abierto();
    const texto = this.texto().trim();
    if (!chat || !this.usuario || !texto || this.enviando()) return;
    if (texto.length > MAX_CHAT) { this.errorChat.set(`El mensaje no puede superar los ${MAX_CHAT} caracteres.`); return; }

    this.enviando.set(true);
    this.errorChat.set(null);
    const id = chat.conversacion.id;
    this.mensajeService.enviarChat(id, this.usuario.id, texto).subscribe({
      next: (m) => {
        this.enviando.set(false);
        this.texto.set('');
        if (this.campo) this.campo.nativeElement.style.height = 'auto';
        if (this.abiertoId() === id) {
          this.abierto.update(c => c ? { ...c, mensajes: [...c.mensajes, m] } : c);
          this.bajar();
          this.enfocar();
        }
        this.cargarLista(true);
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorChat.set(err?.error?.mensaje ?? 'No se pudo enviar el mensaje.');
      },
    });
  }

  async eliminarChat(): Promise<void> {
    const chat = this.abierto();
    this.menuAbierto.set(false);
    if (!chat || !this.usuario) return;
    if (!await this.confirmar.pedir(`¿Eliminar el chat con ${chat.conversacion.nombre}? Solo se borra para ti.`)) return;
    this.mensajeService.eliminarConversacion(chat.conversacion.id, this.usuario.id).subscribe({
      next: () => {
        this.cerrarChat();
        this.cargarLista(true);
        this.notificaciones.refrescar();
        this.toast.exito('Chat eliminado.');
      },
      error: (err) => this.errorChat.set(err?.error?.mensaje ?? 'No se pudo eliminar el chat.'),
    });
  }

  private bajar(): void {
    afterNextRender(() => {
      const el = this.zonaMensajes?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, { injector: this.injector });
  }

  private enfocar(): void {
    afterNextRender(() => this.campo?.nativeElement.focus(), { injector: this.injector });
  }

  // ---------------- Nuevo chat ----------------

  abrirNuevo(): void {
    this.filtroContacto.set('');
    this.errorModal.set(null);
    this.modalNuevo.set(true);
    if (!this.contactos() && this.usuario) {
      this.mensajeService.contactos(this.usuario.id).subscribe({
        next: (c) => this.contactos.set(c),
        error: () => this.errorModal.set('No se pudo cargar la lista de contactos.'),
      });
    }
  }

  cerrarNuevo(): void {
    this.modalNuevo.set(false);
  }

  elegirPersona(c: Contacto): void {
    this.modalNuevo.set(false);
    const existente = this.conversaciones().find(x => x.id === c.usuarioId);
    this.abrir(c.usuarioId, existente ?? {
      id: c.usuarioId, nombre: c.nombre, rol: c.rol, detalle: c.detalle, ultimoMensaje: '',
      ultimoEsMio: false, fecha: null, noLeidos: 0, puedeEscribir: true,
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.menuAbierto()) { this.menuAbierto.set(false); return; }
    if (this.modalNuevo()) { this.cerrarNuevo(); return; }
  }

  // ---------------- Formato ----------------

  /** El nombre del padre va con sus hijos en letra pequeña. */
  esPadreRol(rol: string | null | undefined): boolean {
    const r = (rol ?? '').toLowerCase();
    return r.includes('padre') || r.includes('apoderado') || r.includes('famil');
  }

  hora(fecha: string | null): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  /** Hora si es de hoy; "Ayer"; o la fecha corta. */
  cuando(fecha: string | null): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const dias = diasDesde(d);
    if (dias === 0) return this.hora(fecha);
    if (dias === 1) return 'Ayer';
    if (dias < 7) return d.toLocaleDateString('es-PE', { weekday: 'short' });
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  private etiquetaDia(fecha: string): string {
    const d = new Date(fecha);
    const dias = diasDesde(d);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  claseRol(rol: string): string {
    switch (rol) {
      case 'Docente': return 'bg-[#EFEAF3] text-[#4A1F52]';
      case 'Estudiante': return 'bg-[#E7F3EA] text-[#1E7A3B]';
      case 'Padre': return 'bg-[#FDF1DC] text-[#8A6A00]';
      default: return 'bg-[#F0E6D8] text-[#6B5A67]';
    }
  }
}

function diasDesde(d: Date): number {
  const hoy = new Date();
  const a = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((a - b) / 86400000);
}

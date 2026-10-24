export interface Participante {
  usuarioId: number | null;
  nombre: string;
  rol: string;
  leido: boolean;
}

export interface Mensaje {
  id: number;
  asunto: string;
  contenido: string;          // HTML simple del editor
  fechaEnvio: string;
  respuestaAId: number | null;
  remitente: Participante;
  destinatarios: Participante[];
  leido: boolean;
  bandeja: 'RECIBIDO' | 'ENVIADO';
}

export interface MensajeRequest {
  destinatariosIds: number[];
  asunto: string;
  contenido: string;
  respuestaAId?: number | null;
}

/** Mensaje guardado sin enviar (bandeja Borradores). */
export interface Borrador {
  id: number;
  destinatarioId: number | null;
  destinatarioNombre: string | null;
  destinatarioRol: string | null;
  asunto: string;
  contenido: string;
  respuestaAId: number | null;
  fecha: string;
}

export interface BorradorRequest {
  id?: number | null;
  destinatarioId: number | null;
  asunto: string;
  contenido: string;
  respuestaAId?: number | null;
}

export interface Contacto {
  usuarioId: number;
  nombre: string;
  rol: string;       // Administración | Docente | Estudiante | Padre
  detalle: string;   // "5° A" para alumnos, especialidad para docentes
}

export interface GrupoContacto {
  clave: string;
  nombre: string;
  descripcion: string;
  usuariosIds: number[];
}

export interface Contactos {
  contactos: Contacto[];
  grupos: GrupoContacto[];
}

export interface Notificaciones {
  comunicadosNoLeidos: number;
  mensajesNoLeidos: number;
  total: number;
}

// ---------------- Chat: una conversación por persona ----------------

/** id = usuarioId del otro; 0 = Avisos del colegio; -1 = cuenta eliminada. */
export const CHAT_AVISOS = 0;

export interface Conversacion {
  id: number;
  nombre: string;
  rol: string;
  detalle: string;
  ultimoMensaje: string;
  ultimoEsMio: boolean;
  fecha: string | null;
  noLeidos: number;
  puedeEscribir: boolean;
}

export interface MensajeChat {
  id: number;
  asunto: string | null;     // solo en avisos y mensajes antiguos
  contenido: string;         // HTML simple
  fecha: string;
  mio: boolean;
  leido: boolean;            // si es mío: el otro ya lo vio
  aviso: boolean;
}

export interface Chat {
  conversacion: Conversacion;
  mensajes: MensajeChat[];
}

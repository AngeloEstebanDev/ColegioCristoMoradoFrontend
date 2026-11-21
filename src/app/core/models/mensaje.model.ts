/**
 * Modelo Participante: describe la forma de los datos de «participante». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Participante {
  usuarioId: number | null;
  nombre: string;
  rol: string;
  leido: boolean;
}

/**
 * Modelo Mensaje: describe la forma de los datos de «mensaje». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
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

/**
 * Modelo MensajeRequest: describe la forma de los datos de «mensaje request». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
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

/**
 * Modelo BorradorRequest: describe la forma de los datos de «borrador request». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export interface BorradorRequest {
  id?: number | null;
  destinatarioId: number | null;
  asunto: string;
  contenido: string;
  respuestaAId?: number | null;
}

/**
 * Modelo Contacto: describe la forma de los datos de «contacto». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Contacto {
  usuarioId: number;
  nombre: string;
  rol: string;       // Administración | Docente | Estudiante | Padre
  detalle: string;   // "5° A" para alumnos, especialidad para docentes
}

/**
 * Modelo GrupoContacto: describe la forma de los datos de «grupo contacto». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface GrupoContacto {
  clave: string;
  nombre: string;
  descripcion: string;
  usuariosIds: number[];
}

/**
 * Modelo Contactos: describe la forma de los datos de «contactos». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Contactos {
  contactos: Contacto[];
  grupos: GrupoContacto[];
}

/**
 * Modelo Notificaciones: describe la forma de los datos de «notificaciones». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Notificaciones {
  comunicadosNoLeidos: number;
  mensajesNoLeidos: number;
  total: number;
}

// ---------------- Chat: una conversación por persona ----------------

/** id = usuarioId del otro; 0 = Avisos del colegio; -1 = cuenta eliminada. */
export const CHAT_AVISOS = 0;

/**
 * Modelo Conversacion: describe la forma de los datos de «conversacion». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
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

/**
 * Modelo MensajeChat: describe la forma de los datos de «mensaje chat». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface MensajeChat {
  id: number;
  asunto: string | null;     // solo en avisos y mensajes antiguos
  contenido: string;         // HTML simple
  fecha: string;
  mio: boolean;
  leido: boolean;            // si es mío: el otro ya lo vio
  aviso: boolean;
}

/**
 * Modelo Chat: describe la forma de los datos de «chat». Es lo que viaja en JSON entre el backend y el
 * frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Chat {
  conversacion: Conversacion;
  mensajes: MensajeChat[];
}

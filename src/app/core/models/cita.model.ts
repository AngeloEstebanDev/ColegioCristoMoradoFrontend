/** Mi Agenda: disponibilidad (HU-27) y citas (HU-22, 28, 29, 30). Horas "HH:mm", fechas "yyyy-MM-dd". */

export interface Disponibilidad {
  id: number;
  dia: number;              // 1 = lunes ... 6 = sábado
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  lugar: string | null;
  activo: boolean;
  citasPorSemana: number;
}

/**
 * Modelo DisponibilidadRequest: describe la forma de los datos de «disponibilidad request». Es lo que
 * viaja en JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa
 * mal un campo.
 */
export interface DisponibilidadRequest {
  dia: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  modalidad: string;
  lugar: string | null;
}

/**
 * Modelo PersonaCita: describe la forma de los datos de «persona cita». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface PersonaCita {
  id: number;
  nombre: string;
  rol: string;
  detalle: string | null;
}

/**
 * Modelo HijoCita: describe la forma de los datos de «hijo cita». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface HijoCita {
  id: number;
  nombre: string;
  salon: string;
}

/**
 * Modelo Responsable: describe la forma de los datos de «responsable». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Responsable {
  usuarioId: number;
  nombre: string;
  rol: string;
  detalle: string;
  relacion: string[];
  horarios: Disponibilidad[];
}

/**
 * Modelo PadreContacto: describe la forma de los datos de «padre contacto». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface PadreContacto {
  usuarioId: number;
  nombre: string;
  telefono: string | null;
  hijos: HijoCita[];
}

/**
 * Modelo HorarioLibre: describe la forma de los datos de «horario libre». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface HorarioLibre {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: string;
  lugar: string | null;
}

/**
 * Tipo EstadoCita: describe la forma de los datos de «estado cita». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'REALIZADA';

/**
 * Modelo Cita: describe la forma de los datos de «cita». Es lo que viaja en JSON entre el backend y el
 * frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Cita {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: string;
  lugar: string | null;
  motivo: string;
  origen: 'SOLICITUD_PADRE' | 'PROGRAMADA';
  estado: EstadoCita;
  observacion: string | null;
  responsable: PersonaCita;
  padre: PersonaCita;
  estudiante: HijoCita | null;
  miRol: 'RESPONSABLE' | 'PADRE' | 'ALUMNO';
  pasada: boolean;
  reprogramaciones: number;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  puedeConfirmar: boolean;
  puedeRechazar: boolean;
  puedeReprogramar: boolean;
  puedeCancelar: boolean;
  puedeMarcarRealizada: boolean;
  /** ENVIADA (la creé yo) o RECIBIDA. */
  tipo: 'ENVIADA' | 'RECIBIDA';
  /** Descripción adicional de quien creó la cita. */
  detalle: string | null;
  puedeEliminar: boolean;
}

/** Constante DIAS_AGENDA: valor fijo (días agenda) que se reutiliza en varias partes. */
export const DIAS_AGENDA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Constante ESTADOS_CITA: valor fijo (estados cita) que se reutiliza en varias partes. */
export const ESTADOS_CITA: Record<EstadoCita, { etiqueta: string; color: string; fondo: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#9A6B00', fondo: '#FDF1DC' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#1E7A3B', fondo: '#E7F3EA' },
  RECHAZADA: { etiqueta: 'Rechazada', color: '#A62639', fondo: '#FBE7E9' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#6B5A67', fondo: '#F0E6D8' },
  REALIZADA: { etiqueta: 'Realizada', color: '#2563EB', fondo: '#E6EEFB' },
};

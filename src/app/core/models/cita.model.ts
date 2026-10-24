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

export interface DisponibilidadRequest {
  dia: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  modalidad: string;
  lugar: string | null;
}

export interface PersonaCita {
  id: number;
  nombre: string;
  rol: string;
  detalle: string | null;
}

export interface HijoCita {
  id: number;
  nombre: string;
  salon: string;
}

export interface Responsable {
  usuarioId: number;
  nombre: string;
  rol: string;
  detalle: string;
  relacion: string[];
  horarios: Disponibilidad[];
}

export interface PadreContacto {
  usuarioId: number;
  nombre: string;
  telefono: string | null;
  hijos: HijoCita[];
}

export interface HorarioLibre {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  modalidad: string;
  lugar: string | null;
}

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'REALIZADA';

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

export const DIAS_AGENDA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const ESTADOS_CITA: Record<EstadoCita, { etiqueta: string; color: string; fondo: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', color: '#9A6B00', fondo: '#FDF1DC' },
  CONFIRMADA: { etiqueta: 'Confirmada', color: '#1E7A3B', fondo: '#E7F3EA' },
  RECHAZADA: { etiqueta: 'Rechazada', color: '#A62639', fondo: '#FBE7E9' },
  CANCELADA: { etiqueta: 'Cancelada', color: '#6B5A67', fondo: '#F0E6D8' },
  REALIZADA: { etiqueta: 'Realizada', color: '#2563EB', fondo: '#E6EEFB' },
};

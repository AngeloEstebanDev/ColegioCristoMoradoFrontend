/** HU-18 Asistencia. Fechas "yyyy-MM-dd". */
export type EstadoAsistencia = 'PRESENTE' | 'TARDANZA' | 'FALTA' | 'JUSTIFICADA';

export interface FilaAsistencia {
  estudianteId: number;
  nombre: string;
  estado: EstadoAsistencia | null;
  observacion: string | null;
  foto?: string | null;
}

export interface DiaAsistencia {
  seccionCursoId: number;
  curso: string;
  grado: string;
  letra: string;
  fecha: string;
  registrada: boolean;
  alumnos: FilaAsistencia[];
  fechasRegistradas: string[];
}

export interface ConteoAsistencia {
  presentes: number;
  tardanzas: number;
  faltas: number;
  justificadas: number;
  total: number;
  porcentaje: number | null;
}

export interface ResumenCursoAsistencia {
  seccionCursoId: number;
  curso: string;
  desde: string;
  hasta: string;
  sesiones: number;
  alumnos: { estudianteId: number; nombre: string; conteo: ConteoAsistencia }[];
}

export interface AsistenciaAlumno {
  estudianteId: number;
  nombre: string;
  salon: string;
  desde: string;
  hasta: string;
  total: ConteoAsistencia;
  cursos: { seccionCursoId: number; curso: string; color: string; conteo: ConteoAsistencia }[];
  detalle: { fecha: string; curso: string; color: string; estado: EstadoAsistencia; observacion: string | null }[];
}

export const ESTADOS_ASISTENCIA: { valor: EstadoAsistencia; etiqueta: string; corto: string; color: string; fondo: string }[] = [
  { valor: 'PRESENTE', etiqueta: 'Presente', corto: 'P', color: '#1E7A3B', fondo: '#E7F3EA' },
  { valor: 'TARDANZA', etiqueta: 'Tardanza', corto: 'T', color: '#9A6B00', fondo: '#FDF1DC' },
  { valor: 'FALTA', etiqueta: 'Falta', corto: 'F', color: '#A62639', fondo: '#FBE7E9' },
  { valor: 'JUSTIFICADA', etiqueta: 'Justificada', corto: 'J', color: '#2563EB', fondo: '#E6EEFB' },
];

export function infoAsistencia(estado: string | null | undefined) {
  return ESTADOS_ASISTENCIA.find(e => e.valor === estado);
}

/** Sesión de asistencia de una clase: MARCADA, SIN_MARCAR (generada sin registrar), NO_GENERADA (en rojo) u HOY (aún puede generarse). */
export interface SesionAsistencia {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'MARCADA' | 'SIN_MARCAR' | 'NO_GENERADA' | 'HOY';
  registrados: number;
  /** Solo durante la hora de clase de ese día; al terminar la clase se cierra. */
  editable: boolean;
}

export interface SesionesAsistencia {
  seccionCursoId: number;
  curso: string;
  grado: string;
  letra: string;
  puedeGenerar: boolean;
  claseActual: { fecha: string; horaInicio: string; horaFin: string } | null;
  mensaje: string | null;
  generadas: number;
  marcadas: number;
  pendientes: number;
  noGeneradas: number;
  sesiones: SesionAsistencia[];
}

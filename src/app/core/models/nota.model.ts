/** Calificaciones (HU-16, 17, 19, 20, 21). Escala vigesimal 0 a 20. */

export interface PeriodoCorto {
  id: number;
  nombre: string;
  anio: number;
  bimestre: number;
  activo: boolean;
}

export interface Promedio {
  valor: number | null;
  redondeado: number | null;
  literal: 'AD' | 'A' | 'B' | 'C' | null;
}

export interface EvaluacionNota {
  id: number;
  nombre: string;
  tipo: string;
  peso: number;
  fecha: string | null;
  actividadId: number | null;
  notasRegistradas: number;
}

export interface EvaluacionRequest {
  periodoId: number | null;
  nombre: string;
  tipo: string;
  peso: number;
  fecha: string | null;
}

/** Las claves de los mapas llegan como texto (JSON). */
export interface FilaNotas {
  estudianteId: number;
  nombre: string;
  notas: Record<string, number>;
  comentarios: Record<string, string>;
  promedio: Promedio;
  /** Promedio de tareas, cuestionarios y actividades (null si aún no hay ninguna calificada). */
  participacion: number | null;
  foto: string | null;
}

/** Participación: promedio automático de las actividades del bimestre. */
export interface ParticipacionDetalle {
  actividadId: number;
  titulo: string;
  tipo: string;
  nota: number | null;
  estado: 'CALIFICADA' | 'NO_ENTREGADA' | 'POR_CALIFICAR' | 'PENDIENTE';
  fecha: string | null;
}

export interface ParticipacionAlumno {
  estudianteId: number;
  nombre: string;
  foto: string | null;
  promedio: Promedio;
  detalle: ParticipacionDetalle[];
}

export interface Participacion {
  seccionCursoId: number;
  periodo: PeriodoCorto | null;
  fechaRegistro: string | null;
  actividades: number;
  alumnos: ParticipacionAlumno[];
}

export interface RegistroNotas {
  seccionCursoId: number;
  curso: string;
  color: string;
  grado: string;
  letra: string;
  periodo: PeriodoCorto | null;
  periodos: PeriodoCorto[];
  evaluaciones: EvaluacionNota[];
  alumnos: FilaNotas[];
  promedioCurso: Promedio;
  aprobados: number;
  desaprobados: number;
  sinNotas: number;
}

export interface CambioNota {
  evaluacionId: number;
  estudianteId: number;
  valor: number | null;
  comentario: string | null;
}

export interface CambioHistorial {
  id: number;
  evaluacion: string;
  estudiante: string;
  valorAnterior: number | null;
  valorNuevo: number | null;
  motivo: string | null;
  usuario: string | null;
  fecha: string;
}

export interface NotaDetalle {
  evaluacion: string;
  tipo: string;
  peso: number;
  fecha: string | null;
  valor: number | null;
  comentario: string | null;
}

export interface CursoBoleta {
  seccionCursoId: number;
  curso: string;
  color: string;
  categoria: string;
  docente: string | null;
  periodos: { periodoId: number; promedio: Promedio; notas: NotaDetalle[] }[];
  promedioAnual: Promedio;
}

export interface Boleta {
  estudianteId: number;
  nombre: string;
  grado: string | null;
  letra: string | null;
  anio: number;
  anios: number[];
  periodos: PeriodoCorto[];
  cursos: CursoBoleta[];
  promediosGenerales: { periodoId: number; promedio: Promedio }[];
  promedioAnual: Promedio;
  cursosAprobados: number;
  cursosDesaprobados: number;
}

export interface AnioHistorial {
  anio: number;
  grado: string | null;
  letra: string | null;
  actual: boolean;
  periodos: { periodoId: number; promedio: Promedio }[];
  nombresPeriodos: PeriodoCorto[];
  promedioAnual: Promedio;
  cursos: number;
  cursosAprobados: number;
  cursosDesaprobados: number;
  asistencia: number | null;
  situacion: string;
}

export interface Historial {
  estudianteId: number;
  nombre: string;
  gradoActual: string | null;
  letraActual: string | null;
  anioIngreso: number | null;
  anios: AnioHistorial[];
}

export const TIPOS_EVALUACION: { valor: string; etiqueta: string }[] = [
  { valor: 'EXAMEN', etiqueta: 'Examen' },
  { valor: 'PRACTICA', etiqueta: 'Práctica' },
  { valor: 'TAREA', etiqueta: 'Tarea' },
  { valor: 'CUESTIONARIO', etiqueta: 'Cuestionario' },
  { valor: 'ACTIVIDAD', etiqueta: 'Actividad' },
  { valor: 'PARTICIPACION', etiqueta: 'Participación' },
  { valor: 'PROYECTO', etiqueta: 'Proyecto' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

export function etiquetaEvaluacion(tipo: string): string {
  return TIPOS_EVALUACION.find(t => t.valor === tipo)?.etiqueta ?? tipo;
}

/** Equivalencia literal (escala de logro): AD 18-20, A 14-17, B 11-13, C 0-10. */
export const ESCALA_LITERAL = [
  { literal: 'AD', rango: '18 - 20', nombre: 'Logro destacado', color: '#1E7A3B', fondo: '#E7F3EA' },
  { literal: 'A', rango: '14 - 17', nombre: 'Logro esperado', color: '#2563EB', fondo: '#E6EEFB' },
  { literal: 'B', rango: '11 - 13', nombre: 'En proceso', color: '#9A6B00', fondo: '#FDF1DC' },
  { literal: 'C', rango: '0 - 10', nombre: 'En inicio', color: '#A62639', fondo: '#FBE7E9' },
];

export function colorNota(valor: number | null | undefined): { color: string; fondo: string } {
  if (valor === null || valor === undefined) return { color: '#9A8E97', fondo: 'transparent' };
  const r = Math.round(valor + 1e-9);
  const e = r >= 18 ? ESCALA_LITERAL[0] : r >= 14 ? ESCALA_LITERAL[1] : r >= 11 ? ESCALA_LITERAL[2] : ESCALA_LITERAL[3];
  return { color: e.color, fondo: e.fondo };
}

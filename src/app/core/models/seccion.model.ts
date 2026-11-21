/** Grados de la I.E.: 1° a 6° de Primaria y 1° a 5° de Secundaria (igual que Grados.java). */
export interface GradoInfo {
  valor: string;       // "1° Primaria" (se guarda así en estudiantes.grado y secciones.grado)
  numero: string;      // "1°"
  nivel: 'Primaria' | 'Secundaria';
  titulo: string;      // "1ro de Primaria"
}

/** Constante ORDINAL: valor fijo (ordinal) que se reutiliza en varias partes. */
const ORDINAL = ['1ro', '2do', '3ro', '4to', '5to', '6to'];

/**
 * Constante GRADOS_ACADEMICOS: valor fijo (grados académicos) que se reutiliza en varias partes.
 */
export const GRADOS_ACADEMICOS: GradoInfo[] = [
  ...[1, 2, 3, 4, 5, 6].map(n => ({ valor: `${n}° Primaria`, numero: `${n}°`, nivel: 'Primaria' as const, titulo: `${ORDINAL[n - 1]} de Primaria` })),
  ...[1, 2, 3, 4, 5].map(n => ({ valor: `${n}° Secundaria`, numero: `${n}°`, nivel: 'Secundaria' as const, titulo: `${ORDINAL[n - 1]} de Secundaria` })),
];

/** Función infoGrado: info grado. */
export function infoGrado(valor: string | null | undefined): GradoInfo | undefined {
  return GRADOS_ACADEMICOS.find(g => g.valor === valor);
}

/**
 * Horarios de la I.E. (iguales a Turnos.java), lunes a viernes, iguales en Primaria y Secundaria:
 *   Turno Mañana: 7:30 a. m. a 1:15 p. m. — recreo 10:15 a 10:45 a. m.
 *   Turno Tarde:  1:30 p. m. a 7:45 p. m. — recreo 4:15 a 4:45 p. m.
 * Secciones predefinidas (la letra fija el turno): Primaria A (1° a 6°) y Secundaria A -> Mañana;
 * Primaria B (2° a 5°) -> Tarde. Secciones adicionales ("Otros"): se elige Mañana o Tarde.
 */
export interface SeccionTurno { letra: string; turno: string; horario: string; recreo: string; }
/**
 * Tipo TurnoNombre: describe la forma de los datos de «turno nombre». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export type TurnoNombre = 'Mañana' | 'Tarde';
/** Constante TURNOS: valor fijo (turnos) que se reutiliza en varias partes. */
export const TURNOS: TurnoNombre[] = ['Mañana', 'Tarde'];

/** Constante HORARIO_MANANA: valor fijo (horario manana) que se reutiliza en varias partes. */
const HORARIO_MANANA = { horario: '7:30 a. m. a 1:15 p. m.', recreo: '10:15 a 10:45 a. m.' };
/** Constante HORARIO_TARDE: valor fijo (horario tarde) que se reutiliza en varias partes. */
const HORARIO_TARDE = { horario: '1:30 p. m. a 7:45 p. m.', recreo: '4:15 a 4:45 p. m.' };
/** Constante PRIMARIA_A: valor fijo (primaria a) que se reutiliza en varias partes. */
const PRIMARIA_A: SeccionTurno = { letra: 'A', turno: 'Mañana', ...HORARIO_MANANA };
/** Constante PRIMARIA_B: valor fijo (primaria b) que se reutiliza en varias partes. */
const PRIMARIA_B: SeccionTurno = { letra: 'B', turno: 'Tarde', ...HORARIO_TARDE };
/** Constante SECUNDARIA_A: valor fijo (secundaria a) que se reutiliza en varias partes. */
const SECUNDARIA_A: SeccionTurno = { letra: 'A', turno: 'Mañana', ...HORARIO_MANANA };

/** Secciones predefinidas de un grado: Primaria 2° a 5° -> A y B; Primaria 1° y 6° -> A; Secundaria -> A. */
export function seccionesDelGrado(grado: string | null | undefined): SeccionTurno[] {
  const g = grado ?? '';
  if (g.includes('Secundaria')) return [SECUNDARIA_A];
  return g.startsWith('1°') || g.startsWith('6°') ? [PRIMARIA_A] : [PRIMARIA_A, PRIMARIA_B];
}

/** Horario de un turno elegido (secciones adicionales). */
export function horarioTurno(grado: string | null | undefined, turno: string | null | undefined): { horario: string; recreo: string } | undefined {
  const t = (turno ?? '').toLowerCase();
  if (t === 'mañana' || t === 'manana') return HORARIO_MANANA;
  if (t === 'tarde') return HORARIO_TARDE;
  return undefined;
}

/** Función turnoInfo: turno info. */
function turnoInfo(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): SeccionTurno | undefined {
  const fija = seccionesDelGrado(grado).find(t => t.letra === letra);
  if (fija) return fija;
  const h = horarioTurno(grado, guardado);
  return h ? { letra: letra ?? '', turno: guardado, ...h } : undefined;
}

/** Turno según grado y letra (predefinidas) o el turno guardado (secciones adicionales). */
export function turnoDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.turno ?? guardado;
}

/** "7:30 a. m. a 1:15 p. m." para el turno mañana; '' si no corresponde. */
export function horarioDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.horario ?? '';
}

/** "10:15 a 10:45 a. m." */
export function recreoDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.recreo ?? '';
}

/**
 * Modelo AlumnoSeccion: describe la forma de los datos de «alumno sección». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface AlumnoSeccion {
  id: number;
  nombreCompleto: string;
  usuario: string | null;
  tipoDocumento: string;
  dni: string;
  estado: string;
  usuarioId?: number | null;
}

/**
 * Modelo CursoSeccion: describe la forma de los datos de «curso sección». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface CursoSeccion {
  id: number;            // id de la asignación (seccion_cursos)
  cursoId: number;
  nombre: string;
  color: string;
  descripcion: string | null;
  docenteId: number | null;
  docenteNombre: string | null;
  estado: 'Activo' | 'Inactivo';
  docenteUsuarioId?: number | null;
}

/**
 * Modelo Seccion: describe la forma de los datos de «sección». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Seccion {
  id: number;
  grado: string;
  letra: string;
  turno: string;
  capacidad: number;
  estado: 'Activa' | 'Inactiva';
  totalAlumnos: number;
  totalCursos: number;
  tutorId: number | null;
  tutorNombre: string | null;
  alumnos: AlumnoSeccion[];   // solo en el detalle
  cursos: CursoSeccion[];     // solo en el detalle
  tutorUsuarioId?: number | null;
}

/**
 * Modelo SeccionRequest: describe la forma de los datos de «sección request». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface SeccionRequest {
  grado?: string;
  letra?: string;
  turno: string;
  capacidad: number;
  tutorId?: number | null;
}

/** Curso del catálogo (Académico > Catálogo de Cursos). */
export type { Curso as CursoCatalogo } from './curso.model';

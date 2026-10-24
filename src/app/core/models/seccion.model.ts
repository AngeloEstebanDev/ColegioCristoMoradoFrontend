/** Grados de la I.E.: 1° a 6° de Primaria y 1° a 5° de Secundaria (igual que Grados.java). */
export interface GradoInfo {
  valor: string;       // "1° Primaria" (se guarda así en estudiantes.grado y secciones.grado)
  numero: string;      // "1°"
  nivel: 'Primaria' | 'Secundaria';
  titulo: string;      // "1ro de Primaria"
}

const ORDINAL = ['1ro', '2do', '3ro', '4to', '5to', '6to'];

export const GRADOS_ACADEMICOS: GradoInfo[] = [
  ...[1, 2, 3, 4, 5, 6].map(n => ({ valor: `${n}° Primaria`, numero: `${n}°`, nivel: 'Primaria' as const, titulo: `${ORDINAL[n - 1]} de Primaria` })),
  ...[1, 2, 3, 4, 5].map(n => ({ valor: `${n}° Secundaria`, numero: `${n}°`, nivel: 'Secundaria' as const, titulo: `${ORDINAL[n - 1]} de Secundaria` })),
];

export function infoGrado(valor: string | null | undefined): GradoInfo | undefined {
  return GRADOS_ACADEMICOS.find(g => g.valor === valor);
}

/**
 * Horarios de la I.E. (iguales a Turnos.java).
 * Secciones predefinidas (la letra fija el turno):
 *   Primaria A (1° a 6°): Turno Mañana 7:45 a.m. a 12:35 p.m. — recreo 10:00 a 10:20 a.m.
 *   Primaria B (2° a 5°): Turno Tarde 1:00 p.m. a 5:50 p.m. — recreo 3:15 a 3:35 p.m.
 *   Secundaria A (1° a 5°): Turno Mañana 7:45 a.m. a 2:00 p.m. — recreo 10:45 a 11:00 a.m.
 * Secciones adicionales ("Otros"): se elige Mañana o Tarde y se usa el horario de ese turno.
 *   Secundaria, Turno Tarde: 1:00 p.m. a 7:15 p.m. — recreo 4:00 a 4:15 p.m.
 */
export interface SeccionTurno { letra: string; turno: string; horario: string; recreo: string; }
export type TurnoNombre = 'Mañana' | 'Tarde';
export const TURNOS: TurnoNombre[] = ['Mañana', 'Tarde'];

const PRIMARIA_A: SeccionTurno = { letra: 'A', turno: 'Mañana', horario: '7:45 a.m. a 12:35 p.m.', recreo: '10:00 a 10:20 a.m.' };
const PRIMARIA_B: SeccionTurno = { letra: 'B', turno: 'Tarde', horario: '1:00 p.m. a 5:50 p.m.', recreo: '3:15 a 3:35 p.m.' };
const SECUNDARIA_A: SeccionTurno = { letra: 'A', turno: 'Mañana', horario: '7:45 a.m. a 2:00 p.m.', recreo: '10:45 a 11:00 a.m.' };
const SECUNDARIA_TARDE = { horario: '1:00 p.m. a 7:15 p.m.', recreo: '4:00 a 4:15 p.m.' };

/** Secciones predefinidas de un grado: Primaria 2° a 5° -> A y B; Primaria 1° y 6° -> A; Secundaria -> A. */
export function seccionesDelGrado(grado: string | null | undefined): SeccionTurno[] {
  const g = grado ?? '';
  if (g.includes('Secundaria')) return [SECUNDARIA_A];
  return g.startsWith('1°') || g.startsWith('6°') ? [PRIMARIA_A] : [PRIMARIA_A, PRIMARIA_B];
}

/** Horario de un turno elegido (secciones adicionales) según el nivel del grado. */
export function horarioTurno(grado: string | null | undefined, turno: string | null | undefined): { horario: string; recreo: string } | undefined {
  const t = (turno ?? '').toLowerCase();
  const sec = (grado ?? '').includes('Secundaria');
  if (t === 'mañana' || t === 'manana') return sec ? SECUNDARIA_A : PRIMARIA_A;
  if (t === 'tarde') return sec ? SECUNDARIA_TARDE : PRIMARIA_B;
  return undefined;
}

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

/** "7:45 a.m. a 12:35 p.m." para Primaria A; '' si no corresponde. */
export function horarioDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.horario ?? '';
}

/** "10:00 a 10:20 a.m." */
export function recreoDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.recreo ?? '';
}

export interface AlumnoSeccion {
  id: number;
  nombreCompleto: string;
  usuario: string | null;
  tipoDocumento: string;
  dni: string;
  estado: string;
  usuarioId?: number | null;
}

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

export interface SeccionRequest {
  grado?: string;
  letra?: string;
  turno: string;
  capacidad: number;
  tutorId?: number | null;
}

/** Curso del catálogo (Académico > Catálogo de Cursos). */
export type { Curso as CursoCatalogo } from './curso.model';

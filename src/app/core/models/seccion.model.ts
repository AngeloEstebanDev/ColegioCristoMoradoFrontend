export interface GradoInfo {
  valor: string;
  numero: string;
  nivel: 'Primaria' | 'Secundaria';
  titulo: string;
}

const ORDINAL = ['1ro', '2do', '3ro', '4to', '5to', '6to'];

export const GRADOS_ACADEMICOS: GradoInfo[] = [
  ...[1, 2, 3, 4, 5, 6].map(n => ({ valor: `${n}° Primaria`, numero: `${n}°`, nivel: 'Primaria' as const, titulo: `${ORDINAL[n - 1]} de Primaria` })),
  ...[1, 2, 3, 4, 5].map(n => ({ valor: `${n}° Secundaria`, numero: `${n}°`, nivel: 'Secundaria' as const, titulo: `${ORDINAL[n - 1]} de Secundaria` })),
];

export function infoGrado(valor: string | null | undefined): GradoInfo | undefined {
  return GRADOS_ACADEMICOS.find(g => g.valor === valor);
}

export interface SeccionTurno { letra: string; turno: string; horario: string; recreo: string; }
export type TurnoNombre = 'Mañana' | 'Tarde';
export const TURNOS: TurnoNombre[] = ['Mañana', 'Tarde'];

const HORARIO_MANANA = { horario: '7:30 a. m. a 1:15 p. m.', recreo: '10:15 a 10:45 a. m.' };
const HORARIO_TARDE = { horario: '1:30 p. m. a 7:45 p. m.', recreo: '4:15 a 4:45 p. m.' };
const PRIMARIA_A: SeccionTurno = { letra: 'A', turno: 'Mañana', ...HORARIO_MANANA };
const PRIMARIA_B: SeccionTurno = { letra: 'B', turno: 'Tarde', ...HORARIO_TARDE };
const SECUNDARIA_A: SeccionTurno = { letra: 'A', turno: 'Mañana', ...HORARIO_MANANA };

export function seccionesDelGrado(grado: string | null | undefined): SeccionTurno[] {
  const g = grado ?? '';
  if (g.includes('Secundaria')) return [SECUNDARIA_A];
  return g.startsWith('1°') || g.startsWith('6°') ? [PRIMARIA_A] : [PRIMARIA_A, PRIMARIA_B];
}

export function horarioTurno(grado: string | null | undefined, turno: string | null | undefined): { horario: string; recreo: string } | undefined {
  const t = (turno ?? '').toLowerCase();
  if (t === 'mañana' || t === 'manana') return HORARIO_MANANA;
  if (t === 'tarde') return HORARIO_TARDE;
  return undefined;
}

function turnoInfo(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): SeccionTurno | undefined {
  const fija = seccionesDelGrado(grado).find(t => t.letra === letra);
  if (fija) return fija;
  const h = horarioTurno(grado, guardado);
  return h ? { letra: letra ?? '', turno: guardado, ...h } : undefined;
}

export function turnoDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.turno ?? guardado;
}

export function horarioDe(grado: string | null | undefined, letra: string | null | undefined, guardado = ''): string {
  return turnoInfo(grado, letra, guardado)?.horario ?? '';
}

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
  id: number;
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
  alumnos: AlumnoSeccion[];
  cursos: CursoSeccion[];
  tutorUsuarioId?: number | null;
}

export interface SeccionRequest {
  grado?: string;
  letra?: string;
  turno: string;
  capacidad: number;
  tutorId?: number | null;
}

export type { Curso as CursoCatalogo } from './curso.model';

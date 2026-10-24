/** Editor de horario de una sección. Horas en texto "HH:mm". */
export interface BloqueHorario {
  id?: number | null;
  seccionCursoId: number;
  curso: string;
  color: string;
  docente: string | null;
  estadoCurso?: string;
  dia: number;            // 1 = Lunes ... 5 = Viernes
  horaInicio: string;
  horaFin: string;
}

export interface Horario {
  seccionId: number;
  grado: string;
  letra: string;
  turno: string;
  inicio: string;
  fin: string;
  recesoInicio: string;
  recesoFin: string;
  minutosBloque: number;
  bloques: BloqueHorario[];
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function aMinutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

export function aHora(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

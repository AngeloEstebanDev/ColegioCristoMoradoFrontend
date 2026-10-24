import { BloqueHorario } from './horario.model';

/** Alumno: un curso de su sección con sus bloques de la semana. */
export interface MiCurso {
  id: number;
  nombre: string;
  categoria: string;
  categoriaNombre: string;
  color: string;
  descripcion: string | null;
  docente: string | null;
  minutosSemana: number;
  bloques: BloqueHorario[];
}

export interface MiHorario {
  matriculado: boolean;
  grado: string | null;
  letra: string | null;
  turno: string | null;
  inicio: string | null;
  fin: string | null;
  recesoInicio: string | null;
  recesoFin: string | null;
  minutosBloque: number;
  tutor: string | null;
  bloques: BloqueHorario[];
  cursos: MiCurso[];
}

/** Docente: una clase suya en el horario semanal. */
export interface BloqueDocente {
  seccionCursoId: number;
  curso: string;
  color: string;
  categoria: string;
  grado: string;
  letra: string;
  dia: number;
  horaInicio: string;
  horaFin: string;
}

/** Docente: resumen del dashboard (cursos a cargo, secciones, clases de hoy) y su horario. */
export interface HorarioDocente {
  nombre: string;
  cursos: number;
  secciones: number;
  clasesHoy: number;
  inicio: string;
  fin: string;
  bloques: BloqueDocente[];
}

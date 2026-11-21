import { BloqueHorario } from './horario.model';

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

export interface HorarioDocente {
  nombre: string;
  cursos: number;
  secciones: number;
  clasesHoy: number;
  inicio: string;
  fin: string;
  bloques: BloqueDocente[];
}

export interface Indicador {
  etiqueta: string;
  valor: string;
  detalle: string | null;
}

export interface TablaReporte {
  tipo: string;
  titulo: string;
  subtitulo: string;
  columnas: string[];
  filas: (string | number)[][];
  indicadores: Indicador[];
}

export interface Opcion {
  id: number;
  nombre: string;
}

export interface SeccionOpcion {
  id: number;
  grado: string;
  letra: string;
  nombre: string;
}

export interface AlumnoOpcion {
  id: number;
  nombre: string;
  grado: string;
  letra: string;
  seccionId: number;
}

export interface OpcionesReporte {
  periodos: Opcion[];
  periodoActivo: number | null;
  grados: string[];
  secciones: SeccionOpcion[];
  cursos: Opcion[];
  alumnos: AlumnoOpcion[];
}

export interface ParametrosReporte {
  periodoId?: number | null;
  grado?: string | null;
  seccionId?: number | null;
  estudianteId?: number | null;
  cursoId?: number | null;
}

export type TipoReporte = 'notas' | 'notas-alumno' | 'asistencia-alumno';

export const MAX_FILAS_PDF = 5000;

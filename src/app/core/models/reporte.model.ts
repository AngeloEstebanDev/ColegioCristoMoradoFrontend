/** HU-30/31 Centro de Control de Reportes. */
export interface Indicador {
  etiqueta: string;
  valor: string;
  detalle: string | null;
}

/**
 * Modelo TablaReporte: describe la forma de los datos de «tabla reporte». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface TablaReporte {
  tipo: string;
  titulo: string;
  subtitulo: string;
  columnas: string[];
  filas: (string | number)[][];
  indicadores: Indicador[];
}

/**
 * Modelo Opcion: describe la forma de los datos de «opción». Es lo que viaja en JSON entre el backend
 * y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Opcion {
  id: number;
  nombre: string;
}

/**
 * Modelo SeccionOpcion: describe la forma de los datos de «sección opción». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface SeccionOpcion {
  id: number;
  grado: string;
  letra: string;
  nombre: string;
}

/**
 * Modelo AlumnoOpcion: describe la forma de los datos de «alumno opción». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface AlumnoOpcion {
  id: number;
  nombre: string;
  grado: string;
  letra: string;
  seccionId: number;
}

/** Opciones de los filtros (GET /api/reportes/opciones). */
export interface OpcionesReporte {
  periodos: Opcion[];
  periodoActivo: number | null;
  grados: string[];
  secciones: SeccionOpcion[];
  cursos: Opcion[];
  alumnos: AlumnoOpcion[];
}

/** Filtros de un reporte (null = todos). */
export interface ParametrosReporte {
  periodoId?: number | null;
  grado?: string | null;
  seccionId?: number | null;
  estudianteId?: number | null;
  cursoId?: number | null;
}

/** Tipos del Centro de Control de Reportes. */
export type TipoReporte = 'notas' | 'notas-alumno' | 'asistencia-alumno';

/** Filas máximas que se incluyen en el PDF (el Excel lleva todas las del reporte). */
export const MAX_FILAS_PDF = 5000;

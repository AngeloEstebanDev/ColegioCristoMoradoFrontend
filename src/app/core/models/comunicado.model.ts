/**
 * Tipo GrupoDestino: describe la forma de los datos de «grupo destino». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export type GrupoDestino = 'TODOS' | 'ADMINISTRATIVO' | 'DOCENTES' | 'ALUMNOS' | 'PADRES';

/**
 * Modelo Comunicado: describe la forma de los datos de «comunicado». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Comunicado {
  id: number;
  titulo: string;
  contenido: string;          // HTML simple del editor
  imagen: string | null;      // data URL o enlace
  anuncio: boolean;           // true = se muestra en grande al entrar
  destinatarios: GrupoDestino[];
  seccionIds: number[];       // vacío = todo el colegio
  secciones: string[];        // "3° Primaria A", ...
  autorId: number | null;
  autorNombre: string;
  autorRol: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  leido: boolean;
  totalLecturas: number;
  editable: boolean;          // el usuario logeado puede editarlo/eliminarlo
}

/** Sección a la que se puede dirigir un comunicado. */
export interface SeccionDestino {
  id: number;
  nombre: string;
}

/**
 * Modelo ComunicadoRequest: describe la forma de los datos de «comunicado request». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export interface ComunicadoRequest {
  titulo: string;
  contenido: string;
  imagen: string | null;
  anuncio: boolean;
  destinatarios: GrupoDestino[];
  secciones: number[];        // opcional (administración); obligatorio para docentes
}

/** Constante GRUPOS_DESTINO: valor fijo (grupos destino) que se reutiliza en varias partes. */
export const GRUPOS_DESTINO: { valor: GrupoDestino; etiqueta: string; icono: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos', icono: '🏫' },
  { valor: 'ADMINISTRATIVO', etiqueta: 'Todo el Personal Administrativo', icono: '👤' },
  { valor: 'DOCENTES', etiqueta: 'Todos los Maestros', icono: '👩‍🏫' },
  { valor: 'ALUMNOS', etiqueta: 'Todos los Alumnos', icono: '🎓' },
  { valor: 'PADRES', etiqueta: 'Todos los Padres', icono: '👪' },
];

/** Devuelve la etiqueta de grupo. */
export function etiquetaGrupo(g: string): string {
  const corto: Record<string, string> = {
    TODOS: 'Todos', ADMINISTRATIVO: 'Administrativos', DOCENTES: 'Docentes', ALUMNOS: 'Alumnos', PADRES: 'Padres',
  };
  return corto[g] ?? g;
}

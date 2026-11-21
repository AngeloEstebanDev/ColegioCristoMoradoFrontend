export type GrupoDestino = 'TODOS' | 'ADMINISTRATIVO' | 'DOCENTES' | 'ALUMNOS' | 'PADRES';

export interface Comunicado {
  id: number;
  titulo: string;
  contenido: string;
  imagen: string | null;
  anuncio: boolean;
  destinatarios: GrupoDestino[];
  seccionIds: number[];
  secciones: string[];
  autorId: number | null;
  autorNombre: string;
  autorRol: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  leido: boolean;
  totalLecturas: number;
  editable: boolean;
}

export interface SeccionDestino {
  id: number;
  nombre: string;
}

export interface ComunicadoRequest {
  titulo: string;
  contenido: string;
  imagen: string | null;
  anuncio: boolean;
  destinatarios: GrupoDestino[];
  secciones: number[];
}

export const GRUPOS_DESTINO: { valor: GrupoDestino; etiqueta: string; icono: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos', icono: '🏫' },
  { valor: 'ADMINISTRATIVO', etiqueta: 'Todo el Personal Administrativo', icono: '👤' },
  { valor: 'DOCENTES', etiqueta: 'Todos los Maestros', icono: '👩‍🏫' },
  { valor: 'ALUMNOS', etiqueta: 'Todos los Alumnos', icono: '🎓' },
  { valor: 'PADRES', etiqueta: 'Todos los Padres', icono: '👪' },
];

export function etiquetaGrupo(g: string): string {
  const corto: Record<string, string> = {
    TODOS: 'Todos', ADMINISTRATIVO: 'Administrativos', DOCENTES: 'Docentes', ALUMNOS: 'Alumnos', PADRES: 'Padres',
  };
  return corto[g] ?? g;
}

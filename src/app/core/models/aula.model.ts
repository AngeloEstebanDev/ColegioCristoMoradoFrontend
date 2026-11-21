/** Aula virtual: materiales (HU-13), actividades (HU-14) y entregas (HU-15). Fechas ISO. */

export interface ArchivoInfo {
  id: number;
  nombre: string;
  tipo: string;
  tamanio: number;
}

/** Archivo nuevo que se envía al backend (base64 / data URL). */
export interface ArchivoNuevo {
  nombre: string;
  tipo: string;
  contenido: string;
}

/**
 * Modelo CursoAula: describe la forma de los datos de «curso aula». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface CursoAula {
  seccionCursoId: number;
  seccionId: number;
  grado: string;
  letra: string;
  turno: string;
  cursoId: number;
  curso: string;
  categoria: string;
  color: string;
  descripcion: string | null;
  docente: string | null;
  estado: string;
  totalAlumnos: number;
  materiales: number;
  actividades: number;
  porCalificar: number;   // docente
  pendientes: number;     // alumno
}

/**
 * Modelo Material: describe la forma de los datos de «material». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Material {
  id: number;
  seccionCursoId: number;
  curso: string;
  color: string;
  titulo: string;
  descripcion: string | null;
  enlace: string | null;
  archivo: ArchivoInfo | null;
  autor: string | null;
  fechaPublicacion: string;
  fechaActualizacion: string | null;
  /** TEXTO (descripcion es HTML) | ARCHIVO | ENLACE; null en materiales antiguos. */
  tipo: TipoMaterial | null;
  visible: boolean;
  carpetaId: number | null;
}

/**
 * Tipo TipoMaterial: describe la forma de los datos de «tipo material». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export type TipoMaterial = 'TEXTO' | 'ARCHIVO' | 'ENLACE';

/**
 * Modelo MaterialRequest: describe la forma de los datos de «material request». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export interface MaterialRequest {
  titulo: string;
  descripcion: string | null;
  enlace: string | null;
  archivo: ArchivoNuevo | null;
  quitarArchivo: boolean;
  tipo?: TipoMaterial | null;
  carpetaId?: number | null;
}

/** Carpeta del contenido de un curso; pertenece a un bimestre. */
export interface Carpeta {
  id: number;
  seccionCursoId: number;
  periodoId: number;
  periodo: string;
  bimestre: number;
  anio: number;
  periodoInicio: string;
  periodoFin: string;
  nombre: string;
  visible: boolean;
  fechaCreacion: string;
}

/**
 * Tipo TipoActividad: describe la forma de los datos de «tipo actividad». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export type TipoActividad = 'TAREA' | 'CUESTIONARIO' | 'ACTIVIDAD';
/**
 * Tipo SituacionActividad: describe la forma de los datos de «situacion actividad». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export type SituacionActividad = 'PENDIENTE' | 'ENTREGADA' | 'CALIFICADA' | 'VENCIDA';

/**
 * Modelo Pregunta: describe la forma de los datos de «pregunta». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Pregunta {
  id?: number | null;
  orden?: number;
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: number | null;
  puntos: number;
  /** UNICA (una correcta) | MULTIPLE (varias correctas). */
  tipo?: 'UNICA' | 'MULTIPLE';
  respuestasCorrectas?: number[] | null;
}

/**
 * Modelo Entrega: describe la forma de los datos de «entrega». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Entrega {
  id: number;
  actividadId: number;
  estudianteId: number;
  estudianteNombre: string;
  texto: string | null;
  enlace: string | null;
  archivo: ArchivoInfo | null;
  respuestas: number[];
  fechaEntrega: string;
  tardia: boolean;
  estado: 'ENTREGADA' | 'CALIFICADA';
  puntaje: number | null;
  puntajeMaximo: number;
  nota20: number | null;
  comentarioDocente: string | null;
  fechaCalificacion: string | null;
  /** Opciones marcadas en cada pregunta (cuestionario). */
  selecciones: number[][] | null;
  intentos: number;
  /** Historial: "Entrega 1", "Entrega 2"... */
  envios: Envio[];
}

/** Un envío del historial de una entrega. */
export interface Envio {
  numero: number;
  fecha: string;
  tardia: boolean;
  texto: string | null;
  enlace: string | null;
  archivo: ArchivoInfo | null;
  puntaje: number | null;
  selecciones: number[][] | null;
}

/** Formatos que el docente puede pedir en una entrega. */
export type FormatoArchivo = 'PDF' | 'WORD' | 'EXCEL' | 'PPT' | 'IMAGEN';

/**
 * Constante FORMATOS_ARCHIVO: valor fijo (formatos archivo) que se reutiliza en varias partes.
 */
export const FORMATOS_ARCHIVO: { id: FormatoArchivo; nombre: string; ext: string[] }[] = [
  { id: 'PDF', nombre: 'PDF', ext: ['pdf'] },
  { id: 'WORD', nombre: 'Word', ext: ['doc', 'docx'] },
  { id: 'EXCEL', nombre: 'Excel', ext: ['xls', 'xlsx'] },
  { id: 'PPT', nombre: 'PowerPoint', ext: ['ppt', 'pptx'] },
  { id: 'IMAGEN', nombre: 'Imagen', ext: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
];

/** Extensiones aceptadas para los formatos dados (todos si viene vacío). */
export function extensionesDe(formatos: string[] | null | undefined): string[] {
  const ids = formatos && formatos.length ? formatos : FORMATOS_ARCHIVO.map(f => f.id);
  return FORMATOS_ARCHIVO.filter(f => ids.includes(f.id)).flatMap(f => f.ext);
}

/**
 * Modelo Actividad: describe la forma de los datos de «actividad». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Actividad {
  id: number;
  seccionCursoId: number;
  curso: string;
  color: string;
  grado: string;
  letra: string;
  tipo: TipoActividad;
  titulo: string;
  instrucciones: string | null;
  fechaPublicacion: string;
  fechaLimite: string;
  puntajeMaximo: number;
  permiteTardia: boolean;
  enlace: string | null;
  archivo: ArchivoInfo | null;
  preguntas: Pregunta[];
  evaluacionId: number | null;
  periodo: string | null;
  vencida: boolean;
  totalAlumnos: number;
  entregadas: number;
  calificadas: number;
  situacion: SituacionActividad | null;
  miEntrega: Entrega | null;
  visible: boolean;
  intentosPermitidos: number;
  carpetaId: number | null;
  /** false cuando algún alumno ya envió su respuesta. */
  editable: boolean;
  /** Formatos de archivo que acepta la entrega. */
  formatosPermitidos: FormatoArchivo[];
}

/**
 * Modelo ActividadRequest: describe la forma de los datos de «actividad request». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export interface ActividadRequest {
  tipo: TipoActividad;
  titulo: string;
  instrucciones: string | null;
  fechaLimite: string;          // "yyyy-MM-ddTHH:mm"
  puntajeMaximo: number | null;
  permiteTardia: boolean;
  enlace: string | null;
  archivo: ArchivoNuevo | null;
  quitarArchivo: boolean;
  preguntas: Pregunta[];
  intentosPermitidos?: number | null;
  carpetaId?: number | null;
  formatosPermitidos?: FormatoArchivo[] | null;
}

/**
 * Modelo EntregaRequest: describe la forma de los datos de «entrega request». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface EntregaRequest {
  texto: string | null;
  enlace: string | null;
  archivo: ArchivoNuevo | null;
  respuestas: number[] | null;
  selecciones?: number[][] | null;
}

/**
 * Modelo FilaEntrega: describe la forma de los datos de «fila entrega». Es lo que viaja en JSON entre
 * el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface FilaEntrega {
  estudianteId: number;
  estudianteNombre: string;
  entrega: Entrega | null;
  foto: string | null;
}

/**
 * Modelo Entregas: describe la forma de los datos de «entregas». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Entregas {
  actividad: Actividad;
  alumnos: FilaEntrega[];
}

/**
 * Modelo ResumenDocente: describe la forma de los datos de «resumen docente». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface ResumenDocente {
  nombre: string;
  cursos: number;
  secciones: number;
  alumnos: number;
  porCalificar: number;
  tutorDe: string | null;
  misCursos: CursoAula[];
  proximas: Actividad[];
}

/** Constante TIPOS_ACTIVIDAD: valor fijo (tipos actividad) que se reutiliza en varias partes. */
export const TIPOS_ACTIVIDAD: { valor: TipoActividad; etiqueta: string; descripcion: string; color: string; fondo: string }[] = [
  { valor: 'TAREA', etiqueta: 'Tarea', descripcion: 'El alumno entrega un texto, enlace o archivo', color: '#2563EB', fondo: '#E6EEFB' },
  { valor: 'CUESTIONARIO', etiqueta: 'Cuestionario', descripcion: 'Preguntas de opción múltiple, se califica solo', color: '#7C3AED', fondo: '#F0EAFD' },
  { valor: 'ACTIVIDAD', etiqueta: 'Actividad', descripcion: 'Trabajo práctico, proyecto, exposición...', color: '#059669', fondo: '#E3F4EC' },
];

/** Función infoTipo: info tipo. */
export function infoTipo(tipo: string | null | undefined) {
  return TIPOS_ACTIVIDAD.find(t => t.valor === tipo) ?? TIPOS_ACTIVIDAD[0];
}

/** Constante SITUACIONES: valor fijo (situaciones) que se reutiliza en varias partes. */
export const SITUACIONES: Record<SituacionActividad, { etiqueta: string; clase: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', clase: 'bg-[#FDF1DC] text-[#9A6B00]' },
  ENTREGADA: { etiqueta: 'Entregada', clase: 'bg-[#E6EEFB] text-[#1D4ED8]' },
  CALIFICADA: { etiqueta: 'Calificada', clase: 'bg-[#E7F3EA] text-[#1E7A3B]' },
  VENCIDA: { etiqueta: 'No entregada', clase: 'bg-[#FBE7E9] text-[#A62639]' },
};

/** Docente y compañeros de un curso ("Profesor del curso" y "Participantes"). */
export interface Participante {
  usuarioId: number | null;
  nombre: string;
  detalle: string | null;
  foto: string | null;     // ruta de avatar o data URL
}

/**
 * Modelo Participantes: describe la forma de los datos de «participantes». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Participantes {
  docente: Participante | null;
  alumnos: Participante[];
}

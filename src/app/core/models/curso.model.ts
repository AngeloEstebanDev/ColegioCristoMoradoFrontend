/** Categorías del Catálogo de Cursos (iguales a CategoriaCurso.java). */
export type CategoriaClave =
  'MATEMATICA' | 'COMUNICACION' | 'CIENCIA' | 'SOCIALES' | 'IDIOMAS' | 'ARTE' | 'FORMACION' | 'COMPUTACION' | 'OTROS';

export interface CategoriaCurso {
  clave: CategoriaClave;
  nombre: string;
  color: string;      // color del curso (secciones y horario)
  fondo: string;      // fondo suave para íconos y etiquetas
}

export const CATEGORIAS_CURSO: CategoriaCurso[] = [
  { clave: 'MATEMATICA', nombre: 'Matemática', color: '#2563EB', fondo: '#E6EEFB' },
  { clave: 'COMUNICACION', nombre: 'Comunicación y Literatura', color: '#D97706', fondo: '#FDF1DC' },
  { clave: 'CIENCIA', nombre: 'Ciencia y Tecnología', color: '#059669', fondo: '#E3F4EC' },
  { clave: 'SOCIALES', nombre: 'Ciencias Sociales y Ciudadanía', color: '#DC2626', fondo: '#FBE7E7' },
  { clave: 'IDIOMAS', nombre: 'Idiomas Extranjeros', color: '#7C3AED', fondo: '#EFE8FC' },
  { clave: 'ARTE', nombre: 'Arte y Expresión Corporal', color: '#DB2777', fondo: '#FBE7F1' },
  { clave: 'FORMACION', nombre: 'Formación Personal, Tecnológica y Espiritual', color: '#0D9488', fondo: '#E1F3F1' },
  { clave: 'COMPUTACION', nombre: 'Computación e Informática', color: '#475569', fondo: '#E9EDF2' },
  { clave: 'OTROS', nombre: 'Otros', color: '#6B7280', fondo: '#EEEFF1' },
];

export function categoriaDe(clave: string | null | undefined): CategoriaCurso {
  return CATEGORIAS_CURSO.find(c => c.clave === clave) ?? CATEGORIAS_CURSO[CATEGORIAS_CURSO.length - 1];
}

export interface Curso {
  id: number;
  nombre: string;
  categoria: CategoriaClave;
  categoriaNombre: string;
  color: string;
  estado: string;
  secciones: number;   // en cuántas secciones está asignado
}

export interface CursoRequest {
  nombre: string;
  categoria: CategoriaClave;
}

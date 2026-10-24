/** Avatares predefinidos del colegio (archivos SVG en public/avatares). */
export interface Avatar {
  id: string;
  nombre: string;
}

export interface GrupoAvatares {
  titulo: string;
  avatares: Avatar[];
}

export const GRUPOS_AVATARES: GrupoAvatares[] = [
  {
    titulo: 'Alumnos',
    avatares: [
      { id: 'alumno-1', nombre: 'Alumno' },
      { id: 'alumna-1', nombre: 'Alumna con cola' },
      { id: 'alumno-2', nombre: 'Alumno pelo parado' },
      { id: 'alumna-2', nombre: 'Alumna con trenzas' },
      { id: 'alumno-3', nombre: 'Alumno con buzo' },
      { id: 'alumna-3', nombre: 'Alumna con lentes' },
      { id: 'alumna-4', nombre: 'Alumna con buzo' },
      { id: 'alumno-4', nombre: 'Alumno con lentes' },
    ],
  },
  {
    titulo: 'Docentes y directivos',
    avatares: [
      { id: 'docente-1', nombre: 'Profesor' },
      { id: 'docente-2', nombre: 'Profesora' },
      { id: 'docente-3', nombre: 'Profesor con canas' },
      { id: 'docente-4', nombre: 'Profesora' },
      { id: 'directora', nombre: 'Directora' },
      { id: 'director', nombre: 'Director' },
    ],
  },
  {
    titulo: 'El colegio',
    avatares: [
      { id: 'colegio', nombre: 'Colegio' },
      { id: 'libros', nombre: 'Libros' },
      { id: 'mochila', nombre: 'Mochila' },
      { id: 'lapiz', nombre: 'Lápiz' },
      { id: 'globo', nombre: 'Globo terráqueo' },
      { id: 'birrete', nombre: 'Birrete' },
      { id: 'ciencia', nombre: 'Ciencia' },
      { id: 'calculadora', nombre: 'Calculadora' },
      { id: 'pelota', nombre: 'Deporte' },
      { id: 'paleta', nombre: 'Arte' },
      { id: 'trofeo', nombre: 'Trofeo' },
      { id: 'campana', nombre: 'Campana' },
    ],
  },
];

/** Ruta que se guarda en la foto del usuario (la acepta el backend). */
export function rutaAvatar(id: string): string {
  return `/avatares/${id}.svg`;
}

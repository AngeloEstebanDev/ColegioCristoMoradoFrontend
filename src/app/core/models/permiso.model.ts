export type Permiso = 'COMUNICADOS' | 'REPORTES' | 'ACADEMICO' | 'USUARIOS' | 'PERMISOS';

/** Permisos que el administrador puede dar a cada miembro de la Directiva. */
export const PERMISOS: { valor: Permiso; titulo: string; descripcion: string; sensible: boolean }[] = [
  { valor: 'COMUNICADOS', titulo: 'Crear comunicados', sensible: false,
    descripcion: 'Publicar comunicados institucionales visibles para toda la comunidad.' },
  { valor: 'REPORTES', titulo: 'Ver reportes globales', sensible: true,
    descripcion: 'Acceso al tab de reportes de todos los alumnos, no solo sus cursos asignados.' },
  { valor: 'ACADEMICO', titulo: 'Gestión Académica', sensible: true,
    descripcion: 'Acceso a Grados y Secciones, Catálogo de Cursos, Año Lectivo, Periodos y Vínculo Padre-Hijo.' },
  { valor: 'USUARIOS', titulo: 'Gestión de Usuarios', sensible: true,
    descripcion: 'Acceso para crear y editar cuentas de alumnos, padres, docentes y personal administrativo.' },
  { valor: 'PERMISOS', titulo: 'Gestionar permisos', sensible: true,
    descripcion: 'Asignar o quitar estos permisos al personal de la Directiva (por ejemplo, el Director). No puede cambiar los suyos.' },
];

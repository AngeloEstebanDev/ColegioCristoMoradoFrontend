export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  correoVerificado: boolean;
  rol: string;
  estado: boolean;
  fechaRegistro: string;
  vinculadoA: 'Alumno' | 'Docente' | 'Apoderado' | 'Directiva' | null;
}

export interface UsuarioRequest {
  nombre: string;
  usuario?: string | null;
  dni?: string | null;
  password?: string | null;
  rol: string;
  estado: boolean;
}

export const PREFIJO_USUARIO = { ALUMNO: 'ALU', DOCENTE: 'DOC', APODERADO: 'APO', DIRECTIVA: 'DIR' } as const;

export function usuarioConDni(prefijo: string, dni: string | null | undefined): string {
  const limpio = (dni ?? '').replace(/\s/g, '').toUpperCase();
  return prefijo + (limpio || '········');
}

export const ROLES_SISTEMA = [
  { valor: 'ADMIN', etiqueta: 'Administrador', descripcion: 'Acceso total al sistema' },
  { valor: 'DOCENTE', etiqueta: 'Docente', descripcion: 'Gestiona su información y la de sus cursos' },
  { valor: 'ALUMNO', etiqueta: 'Alumno', descripcion: 'Consulta su información académica' },
  { valor: 'PADRE', etiqueta: 'Padre de Familia', descripcion: 'Consulta información de sus hijos y reportes' },
  { valor: 'DIRECTIVO', etiqueta: 'Directivo', descripcion: 'Gestiona la institución y el personal' },
] as const;

export function etiquetaRol(rol: string): string {
  const encontrado = ROLES_SISTEMA.find(r => r.valor.toLowerCase() === (rol ?? '').toLowerCase());
  return encontrado?.etiqueta ?? rol;
}

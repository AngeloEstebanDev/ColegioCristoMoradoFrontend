import { GRADOS_ACADEMICOS } from './seccion.model';
import { TipoDocumento } from './documento.model';

export interface PadreResumen {
  id: number;
  nombreCompleto: string;
  telefono: string;
  parentesco: string;
}

export interface Estudiante {
  id: number;
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;
  fotoUrl: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  telefono: string | null;
  grado: string | null;
  seccion: string | null;
  anioIngreso: number | null;
  estado: string;
  fechaRegistro: string;
  padres: PadreResumen[];
  usuarioId: number | null;
  correo: string | null;
  usuario: string | null;
  cuentaActiva: boolean | null;
  correoVerificado: boolean;
}

export interface EstudianteRequest {
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;
  fotoUrl?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  nacionalidad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  grado?: string | null;
  seccion?: string | null;
  anioIngreso?: number | null;
  estado: string;
  password?: string | null;
}

export const GRADOS = GRADOS_ACADEMICOS.map(g => g.valor);
export const SECCIONES = ['A', 'B', 'C'];
export const ESTADOS_ESTUDIANTE = ['Activo', 'En proceso', 'Inactivo'];

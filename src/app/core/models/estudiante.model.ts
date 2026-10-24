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
  dni: string;             // número de documento
  fotoUrl: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  telefono: string | null;
  grado: string | null;     // null = sin matrícula
  seccion: string | null;
  anioIngreso: number | null;
  estado: string;
  fechaRegistro: string;
  padres: PadreResumen[];
  // Cuenta de acceso (tabla usuarios). null si el alumno aún no tiene cuenta.
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
  grado?: string | null;     // ya no se envía: la matrícula se hace en Grados y Secciones
  seccion?: string | null;
  anioIngreso?: number | null;
  estado: string;
  /** Al crear: vacío = el DNI. Al editar: vacío = no cambiar. */
  password?: string | null;
}

/** 1° Primaria ... 5° Secundaria. */
export const GRADOS = GRADOS_ACADEMICOS.map(g => g.valor);
export const SECCIONES = ['A', 'B', 'C'];
export const ESTADOS_ESTUDIANTE = ['Activo', 'En proceso', 'Inactivo'];

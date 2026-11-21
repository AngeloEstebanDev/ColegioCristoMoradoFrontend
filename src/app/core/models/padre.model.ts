import { TipoDocumento } from './documento.model';

export interface EstudianteResumen {
  id: number;
  nombreCompleto: string;
  dni: string;
  grado: string;
  seccion: string;
  parentesco: string;
}

export interface PadreFamilia {
  id: number;
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;
  fechaNacimiento: string | null;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  estado: string;
  fechaRegistro: string;
  estudiantes: EstudianteResumen[];
  usuarioId: number | null;
  usuario: string | null;
  correoCuenta: string | null;
  correoVerificado: boolean;
  cuentaActiva: boolean | null;
}

export interface PadreFamiliaRequest {
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;
  fechaNacimiento?: string | null;
  telefono: string;
  correo?: string | null;
  direccion?: string | null;
  estado: string;
  password?: string | null;
}

export const PARENTESCOS = ['Padre', 'Madre', 'Apoderado', 'Tutor', 'Otro familiar'];
export const ESTADOS_PADRE = ['Activo', 'En proceso', 'Inactivo'];

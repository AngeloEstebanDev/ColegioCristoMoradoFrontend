import { TipoDocumento } from './documento.model';

export interface Personal {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombreCompleto: string;
  correo: string | null;          // correo de contacto
  telefono: string | null;
  fechaNacimiento: string | null;
  cargo: string | null;
  estado: string;                 // Activo | Inactivo
  fechaRegistro: string;
  permisos: string[];
  // Cuenta de acceso (usuario DIR + documento)
  usuarioId: number | null;
  usuario: string | null;
  correoCuenta: string | null;
  correoVerificado: boolean;
  cuentaActiva: boolean | null;
}

export interface PersonalRequest {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  cargo?: string | null;
  /** Al crear: vacío = el N.º de documento. Al editar: vacío = no cambiar. */
  password?: string | null;
}

export const CARGOS_SUGERIDOS = [
  'Director(a)', 'Subdirector(a)', 'Coordinador(a) Académico', 'Secretaria', 'Asistente Social',
  'Auxiliar de Educación', 'Psicólogo(a)', 'Administrativo', 'Administrativo-Limpieza', 'Vigilante',
];

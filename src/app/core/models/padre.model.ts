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
  dni: string;                      // número de documento
  fechaNacimiento: string | null;   // se ve en su perfil, no en la tabla
  telefono: string;
  correo: string | null;
  direccion: string | null;
  estado: string;
  fechaRegistro: string;
  /** Solo lectura: los hijos se vinculan en Académico > Vínculo Padre-Hijo. */
  estudiantes: EstudianteResumen[];
  // Cuenta de acceso (usuario APO + documento)
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
  /** Al crear: vacío = el documento. Al editar: vacío = no cambiar. */
  password?: string | null;
}

export const PARENTESCOS = ['Padre', 'Madre', 'Apoderado', 'Tutor', 'Otro familiar'];
export const ESTADOS_PADRE = ['Activo', 'En proceso', 'Inactivo'];

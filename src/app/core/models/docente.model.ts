import { TipoDocumento } from './documento.model';

export interface Docente {
  id: number;
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;             // número de documento
  fotoUrl: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  especialidad: string | null;
  tituloProfesional: string | null;
  fechaIngreso: string | null;
  estado: string;
  usuarioId: number | null;
  cuentaVinculada: boolean;
  fechaRegistro: string;
  // Cuenta de acceso (usuario DOC + DNI)
  usuario: string | null;
  correoCuenta: string | null;     // Gmail vinculado por el docente
  correoVerificado: boolean;
  cuentaActiva: boolean | null;
}

export interface DocenteRequest {
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;
  fotoUrl?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  especialidad?: string | null;
  tituloProfesional?: string | null;
  fechaIngreso?: string | null;
  estado: string;
  /** Al crear: vacío = el DNI. Al editar: vacío = no cambiar. */
  password?: string | null;
}

export const ESPECIALIDADES = [
  'Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Personal Social',
  'Inglés', 'Educación Física', 'Arte y Cultura', 'Educación Religiosa',
  'Tutoría', 'Otra',
];

export const ESTADOS_DOCENTE = ['Activo', 'De licencia', 'Inactivo'];

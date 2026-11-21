import { TipoDocumento } from './documento.model';

/**
 * Modelo Docente: describe la forma de los datos de «docente». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
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

/**
 * Modelo DocenteRequest: describe la forma de los datos de «docente request». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
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

/** Constante ESPECIALIDADES: valor fijo (especialidades) que se reutiliza en varias partes. */
export const ESPECIALIDADES = [
  'Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Personal Social',
  'Inglés', 'Educación Física', 'Arte y Cultura', 'Educación Religiosa',
  'Tutoría', 'Otra',
];

/** Constante ESTADOS_DOCENTE: valor fijo (estados docente) que se reutiliza en varias partes. */
export const ESTADOS_DOCENTE = ['Activo', 'De licencia', 'Inactivo'];

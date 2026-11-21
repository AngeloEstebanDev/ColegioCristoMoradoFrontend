import { TipoDocumento } from './documento.model';

/**
 * Modelo EstudianteResumen: describe la forma de los datos de «estudiante resumen». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export interface EstudianteResumen {
  id: number;
  nombreCompleto: string;
  dni: string;
  grado: string;
  seccion: string;
  parentesco: string;
}

/**
 * Modelo PadreFamilia: describe la forma de los datos de «padre familia». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
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

/**
 * Modelo PadreFamiliaRequest: describe la forma de los datos de «padre familia request». Es lo que
 * viaja en JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa
 * mal un campo.
 */
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

/** Constante PARENTESCOS: valor fijo (parentescos) que se reutiliza en varias partes. */
export const PARENTESCOS = ['Padre', 'Madre', 'Apoderado', 'Tutor', 'Otro familiar'];
/** Constante ESTADOS_PADRE: valor fijo (estados padre) que se reutiliza en varias partes. */
export const ESTADOS_PADRE = ['Activo', 'En proceso', 'Inactivo'];

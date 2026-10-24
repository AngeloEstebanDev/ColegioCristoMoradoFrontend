import { Docente } from './docente.model';
import { Estudiante } from './estudiante.model';
import { PadreFamilia } from './padre.model';
import { Personal } from './personal.model';

export interface Perfil {
  usuarioId: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  correoVerificado: boolean;
  rol: string;
  estado: boolean;
  fechaRegistro: string;
  /** false para alumnos: sus datos solo los cambia la administración. */
  puedeEditar: boolean;
  /** Foto de perfil (data URL) o null. */
  foto: string | null;
  /** Teléfono y dirección (del registro de la persona, o de la cuenta si no tiene). */
  telefono: string | null;
  direccion: string | null;
  // Registro completo de la persona según su rol (solo uno viene lleno)
  docente: Docente | null;
  estudiante: Estudiante | null;
  padre: PadreFamilia | null;
  personal: Personal | null;     // Directiva / Personal Staff
  /** Permisos del panel (admin: todos; Directiva: los que le asignó el admin). */
  permisos: string[];
}

/** Campos que no se envían (undefined) no se cambian. */
export interface PerfilUpdateRequest {
  nombre?: string | null;
  nombres?: string | null;            // Directiva
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;             // Docente
  correoContacto?: string | null;
  especialidad?: string | null;       // Docente
  tituloProfesional?: string | null;  // Docente
  foto?: string | null;               // data URL de la imagen nueva
  quitarFoto?: boolean;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
  codigo: string;          // código enviado al Gmail verificado
}

/** Respuesta al pedir un código de verificación. */
export interface CodigoEnviado {
  correoEnmascarado: string;
  minutosValidez: number;
  segundosParaReenviar: number;
}

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
  puedeEditar: boolean;
  foto: string | null;
  telefono: string | null;
  direccion: string | null;
  docente: Docente | null;
  estudiante: Estudiante | null;
  padre: PadreFamilia | null;
  personal: Personal | null;
  permisos: string[];
}

export interface PerfilUpdateRequest {
  nombre?: string | null;
  nombres?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  correoContacto?: string | null;
  especialidad?: string | null;
  tituloProfesional?: string | null;
  foto?: string | null;
  quitarFoto?: boolean;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
  codigo: string;
}

export interface CodigoEnviado {
  correoEnmascarado: string;
  minutosValidez: number;
  segundosParaReenviar: number;
}

import { TipoDocumento } from './documento.model';

/**
 * Modelo Vinculo: describe la forma de los datos de «vínculo». Es lo que viaja en JSON entre el
 * backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface Vinculo {
  id: number;
  parentesco: string;
  padreId: number;
  padreNombre: string;
  padreTipoDocumento: TipoDocumento;
  padreDocumento: string;
  padreTelefono: string | null;
  padreEstado: string;
  estudianteId: number;
  estudianteNombre: string;
  estudianteTipoDocumento: TipoDocumento;
  estudianteDocumento: string;
  grado: string | null;
  seccion: string | null;
  estudianteEstado: string;
  /** Cuentas de acceso (para las fotos de perfil). */
  padreUsuarioId?: number | null;
  estudianteUsuarioId?: number | null;
}

/**
 * Modelo VinculoRequest: describe la forma de los datos de «vínculo request». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface VinculoRequest {
  padreId?: number | null;
  estudianteId?: number | null;
  parentesco: string;
}

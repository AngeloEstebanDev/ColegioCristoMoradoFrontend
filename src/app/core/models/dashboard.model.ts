/**
 * Modelo DashboardStats: describe la forma de los datos de «dashboard stats». Es lo que viaja en JSON
 * entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un campo.
 */
export interface DashboardStats {
  usuariosActivos: number;
  totalEstudiantes: number;
  totalPadres: number;
  totalDocentes: number;
}

/**
 * Modelo ActividadReciente: describe la forma de los datos de «actividad reciente». Es lo que viaja en
 * JSON entre el backend y el frontend; TypeScript usa esta descripción para avisar si se usa mal un
 * campo.
 */
export interface ActividadReciente {
  fecha: string;
  usuario: string;
  accion: string;
  modulo: string;
  estado: string;
}

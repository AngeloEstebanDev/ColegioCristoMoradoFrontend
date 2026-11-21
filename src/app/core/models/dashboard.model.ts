export interface DashboardStats {
  usuariosActivos: number;
  totalEstudiantes: number;
  totalPadres: number;
  totalDocentes: number;
}

export interface ActividadReciente {
  fecha: string;
  usuario: string;
  accion: string;
  modulo: string;
  estado: string;
}

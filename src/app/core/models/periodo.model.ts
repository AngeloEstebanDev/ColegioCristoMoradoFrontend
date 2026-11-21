export interface Periodo {
  id: number;
  nombre: string;
  anio: number;
  bimestre: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

export interface PeriodoRequest {
  nombre: string;
  anio: number;
  bimestre: number;
  fechaInicio: string;
  fechaFin: string;
}

export const ROMANOS = ['', 'I', 'II', 'III', 'IV'];

export const BIMESTRES = [
  { numero: 1, nombre: '1° Bimestre', color: '#2563EB', fondo: '#E6EEFB' },
  { numero: 2, nombre: '2° Bimestre', color: '#0891B2', fondo: '#E0F3F8' },
  { numero: 3, nombre: '3° Bimestre', color: '#059669', fondo: '#E3F4EC' },
  { numero: 4, nombre: '4° Bimestre', color: '#D97706', fondo: '#FDF1DC' },
];

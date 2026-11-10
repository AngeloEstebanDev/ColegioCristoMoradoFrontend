/** Editor de horario de una sección. Horas en texto "HH:mm". */
export interface BloqueHorario {
  id?: number | null;
  seccionCursoId: number;
  curso: string;
  color: string;
  docente: string | null;
  estadoCurso?: string;
  dia: number;            // 1 = Lunes ... 5 = Viernes
  horaInicio: string;
  horaFin: string;
}

export interface Horario {
  seccionId: number;
  grado: string;
  letra: string;
  turno: string;
  inicio: string;
  fin: string;
  recesoInicio: string;
  recesoFin: string;
  minutosBloque: number;
  bloques: BloqueHorario[];
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function aMinutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

export function aHora(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** Fila del cuadro del horario: 15 minutos, el recreo, o una franja fuera del turno (datos antiguos). */
export interface FilaHorario { inicio: number; fin: number; receso: boolean; fuera: boolean; }

/**
 * Filas del cuadro semanal. Parten del turno (inicio–fin, con su recreo), pero se amplían si algún bloque
 * guardado queda antes o después, para que ningún curso se dibuje fuera del cuadro.
 */
export function filasHorario(
  h: { inicio: string; fin: string; recesoInicio?: string | null; recesoFin?: string | null; minutosBloque?: number | null },
  bloques: { horaInicio: string; horaFin: string }[] = [],
): FilaHorario[] {
  const paso = h.minutosBloque || 15;
  const tIni = aMinutos(h.inicio), tFin = aMinutos(h.fin);
  let ini = tIni, fin = tFin;
  for (const b of bloques) {
    ini = Math.min(ini, Math.floor(aMinutos(b.horaInicio) / paso) * paso);
    fin = Math.max(fin, Math.ceil(aMinutos(b.horaFin) / paso) * paso);
  }
  const rIni = h.recesoInicio ? aMinutos(h.recesoInicio) : -1;
  const rFin = h.recesoFin ? aMinutos(h.recesoFin) : -1;
  const filas: FilaHorario[] = [];
  for (let t = ini; t < fin;) {
    if (rFin > rIni && t === rIni) { filas.push({ inicio: rIni, fin: rFin, receso: true, fuera: false }); t = rFin; continue; }
    const sig = rFin > rIni && t < rIni && t + paso > rIni ? rIni : t + paso;
    filas.push({ inicio: t, fin: sig, receso: false, fuera: t < tIni || t >= tFin });
    t = sig;
  }
  return filas;
}

/**
 * Índice (desde 0) de la fila donde empieza una hora, o donde termina (esFin): la fila que contiene la hora,
 * aunque no coincida exacto con el inicio de una fila. Así un bloque con horas antiguas se dibuja dentro del cuadro.
 */
export function filaDeHora(filas: FilaHorario[], hora: string, esFin = false): number {
  const m = aMinutos(hora);
  if (esFin) {
    const i = filas.findIndex(f => f.inicio >= m);
    return i < 0 ? filas.length : Math.max(i, 1);
  }
  const i = filas.findIndex(f => f.fin > m);
  return i < 0 ? Math.max(filas.length - 1, 0) : i;
}

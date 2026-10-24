import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AsistenciaAlumno, DiaAsistencia, EstadoAsistencia, ResumenCursoAsistencia, SesionesAsistencia } from '../models/asistencia.model';
import { environment } from '../../../environments/environment';

/** HU-18 Asistencia. */
@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/asistencia`;

  dia(seccionCursoId: number, fecha: string): Observable<DiaAsistencia> {
    return this.http.get<DiaAsistencia>(`${this.api}/cursos/${seccionCursoId}`, { params: { fecha } });
  }

  guardar(seccionCursoId: number, fecha: string,
          registros: { estudianteId: number; estado: EstadoAsistencia; observacion: string | null }[]): Observable<DiaAsistencia> {
    return this.http.put<DiaAsistencia>(`${this.api}/cursos/${seccionCursoId}`, { fecha, registros });
  }

  /** Clases del curso con su estado (marcada / sin marcar / no generada). */
  sesiones(seccionCursoId: number): Observable<SesionesAsistencia> {
    return this.http.get<SesionesAsistencia>(`${this.api}/cursos/${seccionCursoId}/sesiones`);
  }

  /** Genera la asistencia de hoy (solo durante la hora de clase). */
  generar(seccionCursoId: number): Observable<SesionesAsistencia> {
    return this.http.post<SesionesAsistencia>(`${this.api}/cursos/${seccionCursoId}/sesiones`, {});
  }

  resumen(seccionCursoId: number, desde?: string, hasta?: string): Observable<ResumenCursoAsistencia> {
    return this.http.get<ResumenCursoAsistencia>(`${this.api}/cursos/${seccionCursoId}/resumen`, { params: rango(desde, hasta) });
  }

  mia(desde?: string, hasta?: string): Observable<AsistenciaAlumno> {
    return this.http.get<AsistenciaAlumno>(`${this.api}/mia`, { params: rango(desde, hasta) });
  }

  delAlumno(estudianteId: number, desde?: string, hasta?: string): Observable<AsistenciaAlumno> {
    return this.http.get<AsistenciaAlumno>(`${this.api}/estudiantes/${estudianteId}`, { params: rango(desde, hasta) });
  }
}

function rango(desde?: string, hasta?: string): Record<string, string> {
  const p: Record<string, string> = {};
  if (desde) p['desde'] = desde;
  if (hasta) p['hasta'] = hasta;
  return p;
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Boleta, CambioHistorial, CambioNota, EvaluacionRequest, Historial, Participacion, RegistroNotas } from '../models/nota.model';
import { environment } from '../../../environments/environment';

/** Calificaciones (HU-16, 17, 19, 20, 21). */
@Injectable({ providedIn: 'root' })
export class NotaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/notas`;

  /** Participación: promedio de las actividades de cada alumno en el bimestre. */
  participacion(seccionCursoId: number, periodoId?: number | null): Observable<Participacion> {
    const params: Record<string, string> = periodoId ? { periodoId: String(periodoId) } : {};
    return this.http.get<Participacion>(`${this.api}/cursos/${seccionCursoId}/participacion`, { params });
  }

  registro(seccionCursoId: number, periodoId?: number | null): Observable<RegistroNotas> {
    return this.http.get<RegistroNotas>(`${this.api}/cursos/${seccionCursoId}`, { params: periodoId ? { periodoId } : {} });
  }
  crearEvaluacion(seccionCursoId: number, datos: EvaluacionRequest): Observable<RegistroNotas> {
    return this.http.post<RegistroNotas>(`${this.api}/cursos/${seccionCursoId}/evaluaciones`, datos);
  }
  actualizarEvaluacion(id: number, datos: EvaluacionRequest): Observable<RegistroNotas> {
    return this.http.put<RegistroNotas>(`${this.api}/evaluaciones/${id}`, datos);
  }
  eliminarEvaluacion(id: number): Observable<RegistroNotas> {
    return this.http.delete<RegistroNotas>(`${this.api}/evaluaciones/${id}`);
  }
  guardarNotas(seccionCursoId: number, cambios: CambioNota[], motivo: string | null): Observable<RegistroNotas> {
    return this.http.put<RegistroNotas>(`${this.api}/cursos/${seccionCursoId}/notas`, { cambios, motivo });
  }
  historialCurso(seccionCursoId: number, periodoId?: number | null): Observable<CambioHistorial[]> {
    return this.http.get<CambioHistorial[]>(`${this.api}/cursos/${seccionCursoId}/historial`, { params: periodoId ? { periodoId } : {} });
  }

  mias(anio?: number | null): Observable<Boleta> {
    return this.http.get<Boleta>(`${this.api}/mias`, { params: anio ? { anio } : {} });
  }
  miHistorial(): Observable<Historial> { return this.http.get<Historial>(`${this.api}/mi-historial`); }
  boleta(estudianteId: number, anio?: number | null): Observable<Boleta> {
    return this.http.get<Boleta>(`${this.api}/estudiantes/${estudianteId}`, { params: anio ? { anio } : {} });
  }
  historial(estudianteId: number): Observable<Historial> {
    return this.http.get<Historial>(`${this.api}/estudiantes/${estudianteId}/historial`);
  }
}

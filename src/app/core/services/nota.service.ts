import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Boleta, CambioHistorial, CambioNota, EvaluacionRequest, Historial, Participacion, RegistroNotas } from '../models/nota.model';
import { environment } from '../../../environments/environment';

/** Calificaciones (HU-16, 17, 19, 20, 21). */
@Injectable({ providedIn: 'root' })
export class NotaService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/notas. */
  private api = `${environment.apiUrl}/notas`;

  /** Participación: promedio de las actividades de cada alumno en el bimestre. */
  participacion(seccionCursoId: number, periodoId?: number | null): Observable<Participacion> {
    const params: Record<string, string> = periodoId ? { periodoId: String(periodoId) } : {};
    return this.http.get<Participacion>(`${this.api}/cursos/${seccionCursoId}/participacion`, { params });
  }

  /**
   * Devuelve «registro». Llama al backend: GET /api/notas/cursos/{seccionCursoId}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  registro(seccionCursoId: number, periodoId?: number | null): Observable<RegistroNotas> {
    return this.http.get<RegistroNotas>(`${this.api}/cursos/${seccionCursoId}`, { params: periodoId ? { periodoId } : {} });
  }
  /**
   * Crea evaluación. Llama al backend: POST /api/notas/cursos/{seccionCursoId}/evaluaciones. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  crearEvaluacion(seccionCursoId: number, datos: EvaluacionRequest): Observable<RegistroNotas> {
    return this.http.post<RegistroNotas>(`${this.api}/cursos/${seccionCursoId}/evaluaciones`, datos);
  }
  /**
   * Actualiza evaluación. Llama al backend: PUT /api/notas/evaluaciones/{id}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  actualizarEvaluacion(id: number, datos: EvaluacionRequest): Observable<RegistroNotas> {
    return this.http.put<RegistroNotas>(`${this.api}/evaluaciones/${id}`, datos);
  }
  /**
   * Elimina evaluación. Llama al backend: DELETE /api/notas/evaluaciones/{id}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  eliminarEvaluacion(id: number): Observable<RegistroNotas> {
    return this.http.delete<RegistroNotas>(`${this.api}/evaluaciones/${id}`);
  }
  /**
   * Guarda notas. Llama al backend: PUT /api/notas/cursos/{seccionCursoId}/notas. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  guardarNotas(seccionCursoId: number, cambios: CambioNota[], motivo: string | null): Observable<RegistroNotas> {
    return this.http.put<RegistroNotas>(`${this.api}/cursos/${seccionCursoId}/notas`, { cambios, motivo });
  }
  /**
   * Devuelve «historial curso». Llama al backend: GET /api/notas/cursos/{seccionCursoId}/historial.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  historialCurso(seccionCursoId: number, periodoId?: number | null): Observable<CambioHistorial[]> {
    return this.http.get<CambioHistorial[]>(`${this.api}/cursos/${seccionCursoId}/historial`, { params: periodoId ? { periodoId } : {} });
  }

  /**
   * Devuelve «mias». Llama al backend: GET /api/notas/mias. Devuelve un Observable (los datos llegan
   * al hacer subscribe).
   */
  mias(anio?: number | null): Observable<Boleta> {
    return this.http.get<Boleta>(`${this.api}/mias`, { params: anio ? { anio } : {} });
  }
  /**
   * Devuelve mi historial (del usuario que inició sesión). Llama al backend: GET
   * /api/notas/mi-historial. Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  miHistorial(): Observable<Historial> { return this.http.get<Historial>(`${this.api}/mi-historial`); }
  /**
   * Devuelve «boleta». Llama al backend: GET /api/notas/estudiantes/{estudianteId}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  boleta(estudianteId: number, anio?: number | null): Observable<Boleta> {
    return this.http.get<Boleta>(`${this.api}/estudiantes/${estudianteId}`, { params: anio ? { anio } : {} });
  }
  /**
   * Devuelve «historial». Llama al backend: GET /api/notas/estudiantes/{estudianteId}/historial.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  historial(estudianteId: number): Observable<Historial> {
    return this.http.get<Historial>(`${this.api}/estudiantes/${estudianteId}/historial`);
  }
}

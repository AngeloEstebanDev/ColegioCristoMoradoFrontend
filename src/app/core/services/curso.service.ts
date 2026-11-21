import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso, CursoRequest } from '../models/curso.model';
import { environment } from '../../../environments/environment';

/** Académico > Catálogo de Cursos. */
@Injectable({ providedIn: 'root' })
export class CursoService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/cursos. */
  private apiUrl = `${environment.apiUrl}/cursos`;

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/cursos. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  listar(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/cursos.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: CursoRequest): Observable<Curso> {
    return this.http.post<Curso>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/cursos/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: CursoRequest): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/${id}`, datos);
  }

  /** Devuelve cuántas secciones conservan el curso (0 = se borró por completo). */
  eliminar(id: number): Observable<{ seccionesQueLoConservan: number }> {
    return this.http.delete<{ seccionesQueLoConservan: number }>(`${this.apiUrl}/${id}`);
  }
}

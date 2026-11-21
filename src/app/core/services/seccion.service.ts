import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CursoCatalogo, Seccion, SeccionRequest } from '../models/seccion.model';
import { Horario } from '../models/horario.model';
import { environment } from '../../../environments/environment';

/** Académico > Grados y Secciones. */
@Injectable({ providedIn: 'root' })
export class SeccionService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/secciones. */
  private apiUrl = `${environment.apiUrl}/secciones`;

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/secciones. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(grado?: string): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(this.apiUrl, { params: grado ? { grado } : {} });
  }

  /**
   * Pide al backend un registro por su id. Llama al backend: GET /api/secciones/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtener(id: number): Observable<Seccion> {
    return this.http.get<Seccion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/secciones.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: SeccionRequest): Observable<Seccion> {
    return this.http.post<Seccion>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/secciones/{id}. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: SeccionRequest): Observable<Seccion> {
    return this.http.put<Seccion>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Cambia estado. Llama al backend: PATCH /api/secciones/{id}/estado. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  cambiarEstado(id: number, activa: boolean): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/estado`, { estado: activa });
  }

  /**
   * Cambia tutor. Llama al backend: PATCH /api/secciones/{id}/tutor. Devuelve un Observable (los datos
   * llegan al hacer subscribe).
   */
  cambiarTutor(id: number, docenteId: number | null): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/tutor`, { docenteId });
  }

  /**
   * Devuelve «matricular». Llama al backend: POST /api/secciones/{id}/alumnos. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  matricular(id: number, estudianteId: number): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.apiUrl}/${id}/alumnos`, { estudianteId });
  }

  /**
   * Devuelve «retirar». Llama al backend: DELETE /api/secciones/{id}/alumnos/{estudianteId}. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  retirar(id: number, estudianteId: number): Observable<Seccion> {
    return this.http.delete<Seccion>(`${this.apiUrl}/${id}/alumnos/${estudianteId}`);
  }

  /**
   * Agrega curso. Llama al backend: POST /api/secciones/{id}/cursos. Devuelve un Observable (los datos
   * llegan al hacer subscribe).
   */
  agregarCurso(id: number, cursoId: number, docenteId: number | null, descripcion: string | null): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.apiUrl}/${id}/cursos`, { cursoId, docenteId, descripcion });
  }

  /**
   * Asigna docente. Llama al backend: PATCH /api/secciones/{id}/cursos/{seccionCursoId}/docente.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  asignarDocente(id: number, seccionCursoId: number, docenteId: number | null): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/cursos/${seccionCursoId}/docente`, { docenteId });
  }

  /** Editar la descripción (comentario) de un curso ya agregado. Vacío = sin descripción. */
  editarDescripcion(id: number, seccionCursoId: number, descripcion: string | null): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/cursos/${seccionCursoId}/descripcion`, { descripcion });
  }

  /**
   * Cambia estado curso. Llama al backend: PATCH /api/secciones/{id}/cursos/{seccionCursoId}/estado.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  cambiarEstadoCurso(id: number, seccionCursoId: number, activo: boolean): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/cursos/${seccionCursoId}/estado`, { estado: activo });
  }

  /** Cuadro del horario (según el turno de la sección) y sus bloques. */
  horario(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/${id}/horario`);
  }

  /** Guarda (reemplaza) todos los bloques del horario. */
  guardarHorario(id: number, bloques: { seccionCursoId: number; dia: number; horaInicio: string; horaFin: string }[]): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/${id}/horario`, { bloques });
  }

  /** Cursos del catálogo (para "Agregar curso"). */
  catalogoCursos(): Observable<CursoCatalogo[]> {
    return this.http.get<CursoCatalogo[]>(`${environment.apiUrl}/cursos`);
  }
}

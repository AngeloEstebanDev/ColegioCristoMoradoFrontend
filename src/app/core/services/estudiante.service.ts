import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estudiante, EstudianteRequest } from '../models/estudiante.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio EstudianteService: se comunica con el backend en /api/estudiantes (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class EstudianteService {
  /** Dirección base del backend para este servicio: /api/estudiantes. */
  private apiUrl = `${environment.apiUrl}/estudiantes`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/estudiantes. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(this.apiUrl);
  }

  /**
   * Pide al backend un registro por su id. Llama al backend: GET /api/estudiantes/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtener(id: number): Observable<Estudiante> {
    return this.http.get<Estudiante>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/estudiantes.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: EstudianteRequest): Observable<Estudiante> {
    return this.http.post<Estudiante>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/estudiantes/{id}. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: EstudianteRequest): Observable<Estudiante> {
    return this.http.put<Estudiante>(`${this.apiUrl}/${id}`, datos);
  }

  /** Botón "Desactivar/Activar cuenta": solo cambia el estado (Activo/Inactivo) y el acceso. */
  cambiarEstado(id: number, activo: boolean): Observable<Estudiante> {
    return this.http.patch<Estudiante>(`${this.apiUrl}/${id}/estado`, { estado: activo });
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/estudiantes/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

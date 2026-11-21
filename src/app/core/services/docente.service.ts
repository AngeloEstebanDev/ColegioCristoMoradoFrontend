import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Docente, DocenteRequest } from '../models/docente.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio DocenteService: se comunica con el backend en /api/docentes (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class DocenteService {
  /** Dirección base del backend para este servicio: /api/docentes. */
  private apiUrl = `${environment.apiUrl}/docentes`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/docentes. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Docente[]> {
    return this.http.get<Docente[]>(this.apiUrl);
  }

  /**
   * Pide al backend un registro por su id. Llama al backend: GET /api/docentes/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtener(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/docentes.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: DocenteRequest): Observable<Docente> {
    return this.http.post<Docente>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/docentes/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: DocenteRequest): Observable<Docente> {
    return this.http.put<Docente>(`${this.apiUrl}/${id}`, datos);
  }

  /** Botón "Desactivar/Activar cuenta": solo cambia el estado (Activo/Inactivo) y el acceso. */
  cambiarEstado(id: number, activo: boolean): Observable<Docente> {
    return this.http.patch<Docente>(`${this.apiUrl}/${id}/estado`, { estado: activo });
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/docentes/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

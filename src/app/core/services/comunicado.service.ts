import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comunicado, ComunicadoRequest, SeccionDestino } from '../models/comunicado.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio ComunicadoService: se comunica con el backend en /api/comunicados (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class ComunicadoService {
  /** Dirección base del backend para este servicio: /api/comunicados. */
  private apiUrl = `${environment.apiUrl}/comunicados`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /** Devuelve «p». */
  private p(usuarioId: number): { params: HttpParams } {
    return { params: new HttpParams().set('usuarioId', usuarioId) };
  }

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/comunicados. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(usuarioId: number): Observable<Comunicado[]> {
    return this.http.get<Comunicado[]>(this.apiUrl, this.p(usuarioId));
  }

  /** Secciones a las que el usuario puede dirigir un comunicado (docente: donde enseña). */
  secciones(usuarioId: number): Observable<SeccionDestino[]> {
    return this.http.get<SeccionDestino[]>(`${this.apiUrl}/secciones`, this.p(usuarioId));
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/comunicados.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(usuarioId: number, datos: ComunicadoRequest): Observable<Comunicado> {
    return this.http.post<Comunicado>(this.apiUrl, datos, this.p(usuarioId));
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/comunicados/{id}. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, usuarioId: number, datos: ComunicadoRequest): Observable<Comunicado> {
    return this.http.put<Comunicado>(`${this.apiUrl}/${id}`, datos, this.p(usuarioId));
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/comunicados/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.p(usuarioId));
  }

  /**
   * Marca leido. Llama al backend: POST /api/comunicados/{id}/leido. Devuelve un Observable (los datos
   * llegan al hacer subscribe).
   */
  marcarLeido(id: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leido`, null, this.p(usuarioId));
  }
}

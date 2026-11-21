import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PadreFamilia, PadreFamiliaRequest } from '../models/padre.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio PadreService: se comunica con el backend en /api/padres (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class PadreService {
  /** Dirección base del backend para este servicio: /api/padres. */
  private apiUrl = `${environment.apiUrl}/padres`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/padres. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  listar(): Observable<PadreFamilia[]> {
    return this.http.get<PadreFamilia[]>(this.apiUrl);
  }

  /**
   * Pide al backend un registro por su id. Llama al backend: GET /api/padres/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtener(id: number): Observable<PadreFamilia> {
    return this.http.get<PadreFamilia>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/padres.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: PadreFamiliaRequest): Observable<PadreFamilia> {
    return this.http.post<PadreFamilia>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/padres/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: PadreFamiliaRequest): Observable<PadreFamilia> {
    return this.http.put<PadreFamilia>(`${this.apiUrl}/${id}`, datos);
  }

  /** Botón "Desactivar/Activar cuenta": solo cambia el estado (Activo/Inactivo) y el acceso. */
  cambiarEstado(id: number, activo: boolean): Observable<PadreFamilia> {
    return this.http.patch<PadreFamilia>(`${this.apiUrl}/${id}/estado`, { estado: activo });
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/padres/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

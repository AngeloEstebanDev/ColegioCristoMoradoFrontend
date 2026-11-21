import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Personal, PersonalRequest } from '../models/personal.model';
import { environment } from '../../../environments/environment';

/** Personal Staff / Directiva. El usuario logeado viaja en X-Usuario-Id (interceptor). */
@Injectable({ providedIn: 'root' })
export class PersonalService {
  /** Dirección base del backend para este servicio: /api/personal. */
  private apiUrl = `${environment.apiUrl}/personal`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/personal. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Personal[]> {
    return this.http.get<Personal[]>(this.apiUrl);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/personal.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: PersonalRequest): Observable<Personal> {
    return this.http.post<Personal>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/personal/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: PersonalRequest): Observable<Personal> {
    return this.http.put<Personal>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Cambia estado. Llama al backend: PATCH /api/personal/{id}/estado. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  cambiarEstado(id: number, estado: boolean): Observable<Personal> {
    return this.http.patch<Personal>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  /** Solo el administrador. */
  actualizarPermisos(id: number, permisos: string[]): Observable<Personal> {
    return this.http.put<Personal>(`${this.apiUrl}/${id}/permisos`, { permisos });
  }
}

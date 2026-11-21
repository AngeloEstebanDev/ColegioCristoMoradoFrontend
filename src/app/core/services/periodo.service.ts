import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Periodo, PeriodoRequest } from '../models/periodo.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio PeriodoService: se comunica con el backend en /api/periodos (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class PeriodoService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/periodos. */
  private apiUrl = `${environment.apiUrl}/periodos`;

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/periodos. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(this.apiUrl);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/periodos.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: PeriodoRequest): Observable<Periodo> {
    return this.http.post<Periodo>(this.apiUrl, datos);
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/periodos/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: PeriodoRequest): Observable<Periodo> {
    return this.http.put<Periodo>(`${this.apiUrl}/${id}`, datos);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vinculo, VinculoRequest } from '../models/vinculo.model';
import { environment } from '../../../environments/environment';

/** Vínculo Padre-Hijo: único lugar donde se relacionan apoderados y alumnos. */
@Injectable({ providedIn: 'root' })
export class VinculoService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/vinculos. */
  private apiUrl = `${environment.apiUrl}/vinculos`;

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/vinculos. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Vinculo[]> {
    return this.http.get<Vinculo[]>(this.apiUrl);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/vinculos.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: VinculoRequest): Observable<Vinculo> {
    return this.http.post<Vinculo>(this.apiUrl, datos);
  }

  /**
   * Cambia parentesco. Llama al backend: PUT /api/vinculos/{id}. Devuelve un Observable (los datos
   * llegan al hacer subscribe).
   */
  cambiarParentesco(id: number, parentesco: string): Observable<Vinculo> {
    return this.http.put<Vinculo>(`${this.apiUrl}/${id}`, { parentesco });
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/vinculos/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

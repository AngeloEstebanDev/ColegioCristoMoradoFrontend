import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActividadReciente, DashboardStats } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio DashboardService: se comunica con el backend en /api/dashboard (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  /** Dirección base del backend para este servicio: /api/dashboard. */
  private apiUrl = `${environment.apiUrl}/dashboard`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene stats. Llama al backend: GET /api/dashboard/stats. Devuelve un Observable (los datos
   * llegan al hacer subscribe).
   */
  obtenerStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Obtiene actividad reciente. Llama al backend: GET /api/dashboard/actividad-reciente. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtenerActividadReciente(): Observable<ActividadReciente[]> {
    return this.http.get<ActividadReciente[]>(`${this.apiUrl}/actividad-reciente`);
  }
}

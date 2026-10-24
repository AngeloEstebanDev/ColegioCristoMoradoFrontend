import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Personal, PersonalRequest } from '../models/personal.model';
import { environment } from '../../../environments/environment';

/** Personal Staff / Directiva. El usuario logeado viaja en X-Usuario-Id (interceptor). */
@Injectable({ providedIn: 'root' })
export class PersonalService {
  private apiUrl = `${environment.apiUrl}/personal`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Personal[]> {
    return this.http.get<Personal[]>(this.apiUrl);
  }

  crear(datos: PersonalRequest): Observable<Personal> {
    return this.http.post<Personal>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: PersonalRequest): Observable<Personal> {
    return this.http.put<Personal>(`${this.apiUrl}/${id}`, datos);
  }

  cambiarEstado(id: number, estado: boolean): Observable<Personal> {
    return this.http.patch<Personal>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  /** Solo el administrador. */
  actualizarPermisos(id: number, permisos: string[]): Observable<Personal> {
    return this.http.put<Personal>(`${this.apiUrl}/${id}/permisos`, { permisos });
  }
}

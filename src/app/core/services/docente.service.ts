import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Docente, DocenteRequest } from '../models/docente.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private apiUrl = `${environment.apiUrl}/docentes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Docente[]> {
    return this.http.get<Docente[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Docente> {
    return this.http.get<Docente>(`${this.apiUrl}/${id}`);
  }

  crear(datos: DocenteRequest): Observable<Docente> {
    return this.http.post<Docente>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: DocenteRequest): Observable<Docente> {
    return this.http.put<Docente>(`${this.apiUrl}/${id}`, datos);
  }

  /** Botón "Desactivar/Activar cuenta": solo cambia el estado (Activo/Inactivo) y el acceso. */
  cambiarEstado(id: number, activo: boolean): Observable<Docente> {
    return this.http.patch<Docente>(`${this.apiUrl}/${id}/estado`, { estado: activo });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

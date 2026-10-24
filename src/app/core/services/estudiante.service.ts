import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estudiante, EstudianteRequest } from '../models/estudiante.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private apiUrl = `${environment.apiUrl}/estudiantes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Estudiante> {
    return this.http.get<Estudiante>(`${this.apiUrl}/${id}`);
  }

  crear(datos: EstudianteRequest): Observable<Estudiante> {
    return this.http.post<Estudiante>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: EstudianteRequest): Observable<Estudiante> {
    return this.http.put<Estudiante>(`${this.apiUrl}/${id}`, datos);
  }

  /** Botón "Desactivar/Activar cuenta": solo cambia el estado (Activo/Inactivo) y el acceso. */
  cambiarEstado(id: number, activo: boolean): Observable<Estudiante> {
    return this.http.patch<Estudiante>(`${this.apiUrl}/${id}/estado`, { estado: activo });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

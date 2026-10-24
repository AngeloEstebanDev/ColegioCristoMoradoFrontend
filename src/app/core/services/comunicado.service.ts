import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comunicado, ComunicadoRequest, SeccionDestino } from '../models/comunicado.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComunicadoService {
  private apiUrl = `${environment.apiUrl}/comunicados`;

  constructor(private http: HttpClient) {}

  private p(usuarioId: number): { params: HttpParams } {
    return { params: new HttpParams().set('usuarioId', usuarioId) };
  }

  listar(usuarioId: number): Observable<Comunicado[]> {
    return this.http.get<Comunicado[]>(this.apiUrl, this.p(usuarioId));
  }

  /** Secciones a las que el usuario puede dirigir un comunicado (docente: donde enseña). */
  secciones(usuarioId: number): Observable<SeccionDestino[]> {
    return this.http.get<SeccionDestino[]>(`${this.apiUrl}/secciones`, this.p(usuarioId));
  }

  crear(usuarioId: number, datos: ComunicadoRequest): Observable<Comunicado> {
    return this.http.post<Comunicado>(this.apiUrl, datos, this.p(usuarioId));
  }

  actualizar(id: number, usuarioId: number, datos: ComunicadoRequest): Observable<Comunicado> {
    return this.http.put<Comunicado>(`${this.apiUrl}/${id}`, datos, this.p(usuarioId));
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.p(usuarioId));
  }

  marcarLeido(id: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leido`, null, this.p(usuarioId));
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PadreFamilia, PadreFamiliaRequest } from '../models/padre.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PadreService {
  private apiUrl = `${environment.apiUrl}/padres`;

  constructor(private http: HttpClient) {}

  listar(): Observable<PadreFamilia[]> {
    return this.http.get<PadreFamilia[]>(this.apiUrl);
  }

  obtener(id: number): Observable<PadreFamilia> {
    return this.http.get<PadreFamilia>(`${this.apiUrl}/${id}`);
  }

  crear(datos: PadreFamiliaRequest): Observable<PadreFamilia> {
    return this.http.post<PadreFamilia>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: PadreFamiliaRequest): Observable<PadreFamilia> {
    return this.http.put<PadreFamilia>(`${this.apiUrl}/${id}`, datos);
  }

  /** Botón "Desactivar/Activar cuenta": solo cambia el estado (Activo/Inactivo) y el acceso. */
  cambiarEstado(id: number, activo: boolean): Observable<PadreFamilia> {
    return this.http.patch<PadreFamilia>(`${this.apiUrl}/${id}/estado`, { estado: activo });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

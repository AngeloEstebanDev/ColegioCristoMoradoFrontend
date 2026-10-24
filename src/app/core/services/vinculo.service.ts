import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vinculo, VinculoRequest } from '../models/vinculo.model';
import { environment } from '../../../environments/environment';

/** Vínculo Padre-Hijo: único lugar donde se relacionan apoderados y alumnos. */
@Injectable({ providedIn: 'root' })
export class VinculoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vinculos`;

  listar(): Observable<Vinculo[]> {
    return this.http.get<Vinculo[]>(this.apiUrl);
  }

  crear(datos: VinculoRequest): Observable<Vinculo> {
    return this.http.post<Vinculo>(this.apiUrl, datos);
  }

  cambiarParentesco(id: number, parentesco: string): Observable<Vinculo> {
    return this.http.put<Vinculo>(`${this.apiUrl}/${id}`, { parentesco });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

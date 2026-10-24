import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Periodo, PeriodoRequest } from '../models/periodo.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PeriodoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/periodos`;

  listar(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(this.apiUrl);
  }

  crear(datos: PeriodoRequest): Observable<Periodo> {
    return this.http.post<Periodo>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: PeriodoRequest): Observable<Periodo> {
    return this.http.put<Periodo>(`${this.apiUrl}/${id}`, datos);
  }
}

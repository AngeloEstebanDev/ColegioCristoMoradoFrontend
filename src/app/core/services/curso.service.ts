import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso, CursoRequest } from '../models/curso.model';
import { environment } from '../../../environments/environment';

/** Académico > Catálogo de Cursos. */
@Injectable({ providedIn: 'root' })
export class CursoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cursos`;

  listar(): Observable<Curso[]> {
    return this.http.get<Curso[]>(this.apiUrl);
  }

  crear(datos: CursoRequest): Observable<Curso> {
    return this.http.post<Curso>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: CursoRequest): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/${id}`, datos);
  }

  /** Devuelve cuántas secciones conservan el curso (0 = se borró por completo). */
  eliminar(id: number): Observable<{ seccionesQueLoConservan: number }> {
    return this.http.delete<{ seccionesQueLoConservan: number }>(`${this.apiUrl}/${id}`);
  }
}

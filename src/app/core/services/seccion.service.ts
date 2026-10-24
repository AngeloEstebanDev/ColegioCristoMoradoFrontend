import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CursoCatalogo, Seccion, SeccionRequest } from '../models/seccion.model';
import { Horario } from '../models/horario.model';
import { environment } from '../../../environments/environment';

/** Académico > Grados y Secciones. */
@Injectable({ providedIn: 'root' })
export class SeccionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/secciones`;

  listar(grado?: string): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(this.apiUrl, { params: grado ? { grado } : {} });
  }

  obtener(id: number): Observable<Seccion> {
    return this.http.get<Seccion>(`${this.apiUrl}/${id}`);
  }

  crear(datos: SeccionRequest): Observable<Seccion> {
    return this.http.post<Seccion>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: SeccionRequest): Observable<Seccion> {
    return this.http.put<Seccion>(`${this.apiUrl}/${id}`, datos);
  }

  cambiarEstado(id: number, activa: boolean): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/estado`, { estado: activa });
  }

  cambiarTutor(id: number, docenteId: number | null): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/tutor`, { docenteId });
  }

  matricular(id: number, estudianteId: number): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.apiUrl}/${id}/alumnos`, { estudianteId });
  }

  retirar(id: number, estudianteId: number): Observable<Seccion> {
    return this.http.delete<Seccion>(`${this.apiUrl}/${id}/alumnos/${estudianteId}`);
  }

  agregarCurso(id: number, cursoId: number, docenteId: number | null, descripcion: string | null): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.apiUrl}/${id}/cursos`, { cursoId, docenteId, descripcion });
  }

  asignarDocente(id: number, seccionCursoId: number, docenteId: number | null): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/cursos/${seccionCursoId}/docente`, { docenteId });
  }

  /** Editar la descripción (comentario) de un curso ya agregado. Vacío = sin descripción. */
  editarDescripcion(id: number, seccionCursoId: number, descripcion: string | null): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/cursos/${seccionCursoId}/descripcion`, { descripcion });
  }

  cambiarEstadoCurso(id: number, seccionCursoId: number, activo: boolean): Observable<Seccion> {
    return this.http.patch<Seccion>(`${this.apiUrl}/${id}/cursos/${seccionCursoId}/estado`, { estado: activo });
  }

  /** Cuadro del horario (según el turno de la sección) y sus bloques. */
  horario(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/${id}/horario`);
  }

  /** Guarda (reemplaza) todos los bloques del horario. */
  guardarHorario(id: number, bloques: { seccionCursoId: number; dia: number; horaInicio: string; horaFin: string }[]): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/${id}/horario`, { bloques });
  }

  /** Cursos del catálogo (para "Agregar curso"). */
  catalogoCursos(): Observable<CursoCatalogo[]> {
    return this.http.get<CursoCatalogo[]>(`${environment.apiUrl}/cursos`);
  }
}

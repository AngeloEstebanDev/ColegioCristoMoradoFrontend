import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Actividad, ActividadRequest, Carpeta, CursoAula, EntregaRequest, Entregas, Material, MaterialRequest, Participantes, ResumenDocente,
} from '../models/aula.model';
import { environment } from '../../../environments/environment';

/** Aula virtual (el usuario va en la cabecera X-Usuario-Id). */
@Injectable({ providedIn: 'root' })
export class AulaService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/aula`;

  // Cursos
  cursosDocente(): Observable<CursoAula[]> { return this.http.get<CursoAula[]>(`${this.api}/docente/cursos`); }
  resumenDocente(): Observable<ResumenDocente> { return this.http.get<ResumenDocente>(`${this.api}/docente/resumen`); }
  misCursos(): Observable<CursoAula[]> { return this.http.get<CursoAula[]>(`${this.api}/mis-cursos`); }
  cursosHijo(estudianteId: number): Observable<CursoAula[]> { return this.http.get<CursoAula[]>(`${this.api}/hijos/${estudianteId}/cursos`); }
  curso(seccionCursoId: number): Observable<CursoAula> { return this.http.get<CursoAula>(`${this.api}/cursos/${seccionCursoId}`); }
  participantes(seccionCursoId: number): Observable<Participantes> {
    return this.http.get<Participantes>(`${this.api}/cursos/${seccionCursoId}/participantes`);
  }

  // Materiales
  materiales(seccionCursoId: number): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.api}/cursos/${seccionCursoId}/materiales`);
  }
  crearMaterial(seccionCursoId: number, datos: MaterialRequest): Observable<Material> {
    return this.http.post<Material>(`${this.api}/cursos/${seccionCursoId}/materiales`, datos);
  }
  actualizarMaterial(id: number, datos: MaterialRequest): Observable<Material> {
    return this.http.put<Material>(`${this.api}/materiales/${id}`, datos);
  }
  eliminarMaterial(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/materiales/${id}`); }
  visibleMaterial(id: number, visible: boolean): Observable<Material> {
    return this.http.patch<Material>(`${this.api}/materiales/${id}/visible`, { visible });
  }

  // Carpetas (se crean en el bimestre activo)
  carpetas(seccionCursoId: number): Observable<Carpeta[]> { return this.http.get<Carpeta[]>(`${this.api}/cursos/${seccionCursoId}/carpetas`); }
  crearCarpeta(seccionCursoId: number, nombre: string): Observable<Carpeta> {
    return this.http.post<Carpeta>(`${this.api}/cursos/${seccionCursoId}/carpetas`, { nombre });
  }
  renombrarCarpeta(id: number, nombre: string): Observable<Carpeta> { return this.http.put<Carpeta>(`${this.api}/carpetas/${id}`, { nombre }); }
  visibleCarpeta(id: number, visible: boolean): Observable<Carpeta> {
    return this.http.patch<Carpeta>(`${this.api}/carpetas/${id}/visible`, { visible });
  }
  eliminarCarpeta(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/carpetas/${id}`); }

  // Actividades
  actividades(seccionCursoId: number): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.api}/cursos/${seccionCursoId}/actividades`);
  }
  actividad(id: number): Observable<Actividad> { return this.http.get<Actividad>(`${this.api}/actividades/${id}`); }
  crearActividad(seccionCursoId: number, datos: ActividadRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.api}/cursos/${seccionCursoId}/actividades`, datos);
  }
  actualizarActividad(id: number, datos: ActividadRequest): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.api}/actividades/${id}`, datos);
  }
  eliminarActividad(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/actividades/${id}`); }
  visibleActividad(id: number, visible: boolean): Observable<Actividad> {
    return this.http.patch<Actividad>(`${this.api}/actividades/${id}/visible`, { visible });
  }
  /** Docente: aceptar (o no) entregas después de la fecha límite. */
  tardiaActividad(id: number, permiteTardia: boolean): Observable<Actividad> {
    return this.http.patch<Actividad>(`${this.api}/actividades/${id}/tardia`, { permiteTardia });
  }
  misActividades(): Observable<Actividad[]> { return this.http.get<Actividad[]>(`${this.api}/mis-actividades`); }
  actividadesHijo(estudianteId: number): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.api}/hijos/${estudianteId}/actividades`);
  }

  // Entregas
  entregar(actividadId: number, datos: EntregaRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.api}/actividades/${actividadId}/entrega`, datos);
  }
  entregas(actividadId: number): Observable<Entregas> { return this.http.get<Entregas>(`${this.api}/actividades/${actividadId}/entregas`); }
  calificar(entregaId: number, puntaje: number, comentario: string | null): Observable<Entregas> {
    return this.http.patch<Entregas>(`${this.api}/entregas/${entregaId}/calificar`, { puntaje, comentario });
  }
}

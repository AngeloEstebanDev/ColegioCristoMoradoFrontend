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
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/aula. */
  private api = `${environment.apiUrl}/aula`;

  // Cursos
  cursosDocente(): Observable<CursoAula[]> { return this.http.get<CursoAula[]>(`${this.api}/docente/cursos`); }
  /**
   * Devuelve el resumen de docente. Llama al backend: GET /api/aula/docente/resumen. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  resumenDocente(): Observable<ResumenDocente> { return this.http.get<ResumenDocente>(`${this.api}/docente/resumen`); }
  /**
   * Devuelve mis cursos (del usuario que inició sesión). Llama al backend: GET /api/aula/mis-cursos.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  misCursos(): Observable<CursoAula[]> { return this.http.get<CursoAula[]>(`${this.api}/mis-cursos`); }
  /**
   * Devuelve «cursos hijo». Llama al backend: GET /api/aula/hijos/{estudianteId}/cursos. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  cursosHijo(estudianteId: number): Observable<CursoAula[]> { return this.http.get<CursoAula[]>(`${this.api}/hijos/${estudianteId}/cursos`); }
  /**
   * Devuelve «curso». Llama al backend: GET /api/aula/cursos/{seccionCursoId}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  curso(seccionCursoId: number): Observable<CursoAula> { return this.http.get<CursoAula>(`${this.api}/cursos/${seccionCursoId}`); }
  /**
   * Devuelve «participantes». Llama al backend: GET /api/aula/cursos/{seccionCursoId}/participantes.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  participantes(seccionCursoId: number): Observable<Participantes> {
    return this.http.get<Participantes>(`${this.api}/cursos/${seccionCursoId}/participantes`);
  }

  // Materiales
  materiales(seccionCursoId: number): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.api}/cursos/${seccionCursoId}/materiales`);
  }
  /**
   * Crea material. Llama al backend: POST /api/aula/cursos/{seccionCursoId}/materiales. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  crearMaterial(seccionCursoId: number, datos: MaterialRequest): Observable<Material> {
    return this.http.post<Material>(`${this.api}/cursos/${seccionCursoId}/materiales`, datos);
  }
  /**
   * Actualiza material. Llama al backend: PUT /api/aula/materiales/{id}. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  actualizarMaterial(id: number, datos: MaterialRequest): Observable<Material> {
    return this.http.put<Material>(`${this.api}/materiales/${id}`, datos);
  }
  /**
   * Elimina material. Llama al backend: DELETE /api/aula/materiales/{id}. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  eliminarMaterial(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/materiales/${id}`); }
  /**
   * Devuelve «visible material». Llama al backend: PATCH /api/aula/materiales/{id}/visible. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  visibleMaterial(id: number, visible: boolean): Observable<Material> {
    return this.http.patch<Material>(`${this.api}/materiales/${id}/visible`, { visible });
  }

  // Carpetas (se crean en el bimestre activo)
  carpetas(seccionCursoId: number): Observable<Carpeta[]> { return this.http.get<Carpeta[]>(`${this.api}/cursos/${seccionCursoId}/carpetas`); }
  /**
   * Crea carpeta. Llama al backend: POST /api/aula/cursos/{seccionCursoId}/carpetas. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  crearCarpeta(seccionCursoId: number, nombre: string): Observable<Carpeta> {
    return this.http.post<Carpeta>(`${this.api}/cursos/${seccionCursoId}/carpetas`, { nombre });
  }
  /**
   * Devuelve «renombrar carpeta». Llama al backend: PUT /api/aula/carpetas/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  renombrarCarpeta(id: number, nombre: string): Observable<Carpeta> { return this.http.put<Carpeta>(`${this.api}/carpetas/${id}`, { nombre }); }
  /**
   * Devuelve «visible carpeta». Llama al backend: PATCH /api/aula/carpetas/{id}/visible. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  visibleCarpeta(id: number, visible: boolean): Observable<Carpeta> {
    return this.http.patch<Carpeta>(`${this.api}/carpetas/${id}/visible`, { visible });
  }
  /**
   * Elimina carpeta. Llama al backend: DELETE /api/aula/carpetas/{id}. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  eliminarCarpeta(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/carpetas/${id}`); }

  // Actividades
  actividades(seccionCursoId: number): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.api}/cursos/${seccionCursoId}/actividades`);
  }
  /**
   * Devuelve «actividad». Llama al backend: GET /api/aula/actividades/{id}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  actividad(id: number): Observable<Actividad> { return this.http.get<Actividad>(`${this.api}/actividades/${id}`); }
  /**
   * Crea actividad. Llama al backend: POST /api/aula/cursos/{seccionCursoId}/actividades. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  crearActividad(seccionCursoId: number, datos: ActividadRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.api}/cursos/${seccionCursoId}/actividades`, datos);
  }
  /**
   * Actualiza actividad. Llama al backend: PUT /api/aula/actividades/{id}. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  actualizarActividad(id: number, datos: ActividadRequest): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.api}/actividades/${id}`, datos);
  }
  /**
   * Elimina actividad. Llama al backend: DELETE /api/aula/actividades/{id}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  eliminarActividad(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/actividades/${id}`); }
  /**
   * Devuelve «visible actividad». Llama al backend: PATCH /api/aula/actividades/{id}/visible. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  visibleActividad(id: number, visible: boolean): Observable<Actividad> {
    return this.http.patch<Actividad>(`${this.api}/actividades/${id}/visible`, { visible });
  }
  /** Docente: aceptar (o no) entregas después de la fecha límite. */
  tardiaActividad(id: number, permiteTardia: boolean): Observable<Actividad> {
    return this.http.patch<Actividad>(`${this.api}/actividades/${id}/tardia`, { permiteTardia });
  }
  /**
   * Devuelve mis actividades (del usuario que inició sesión). Llama al backend: GET
   * /api/aula/mis-actividades. Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  misActividades(): Observable<Actividad[]> { return this.http.get<Actividad[]>(`${this.api}/mis-actividades`); }
  /**
   * Devuelve «actividades hijo». Llama al backend: GET /api/aula/hijos/{estudianteId}/actividades.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  actividadesHijo(estudianteId: number): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.api}/hijos/${estudianteId}/actividades`);
  }

  // Entregas
  entregar(actividadId: number, datos: EntregaRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.api}/actividades/${actividadId}/entrega`, datos);
  }
  /**
   * Devuelve «entregas». Llama al backend: GET /api/aula/actividades/{actividadId}/entregas. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  entregas(actividadId: number): Observable<Entregas> { return this.http.get<Entregas>(`${this.api}/actividades/${actividadId}/entregas`); }
  /**
   * Devuelve «calificar». Llama al backend: PATCH /api/aula/entregas/{entregaId}/calificar. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  calificar(entregaId: number, puntaje: number, comentario: string | null): Observable<Entregas> {
    return this.http.patch<Entregas>(`${this.api}/entregas/${entregaId}/calificar`, { puntaje, comentario });
  }
}

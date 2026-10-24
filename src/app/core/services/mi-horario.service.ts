import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorarioDocente, MiHorario } from '../models/mi-horario.model';
import { environment } from '../../../environments/environment';

/** Alumno (y docente): su horario y sus cursos (el usuario va en la cabecera X-Usuario-Id). */
@Injectable({ providedIn: 'root' })
export class MiHorarioService {
  private http = inject(HttpClient);

  obtener(): Observable<MiHorario> {
    return this.http.get<MiHorario>(`${environment.apiUrl}/mi-horario`);
  }

  /** Padre: horario y cursos de uno de sus hijos. */
  hijo(estudianteId: number): Observable<MiHorario> {
    return this.http.get<MiHorario>(`${environment.apiUrl}/mi-horario/hijos/${estudianteId}`);
  }

  /** Docente: sus clases de la semana y el resumen del dashboard. */
  docente(): Observable<HorarioDocente> {
    return this.http.get<HorarioDocente>(`${environment.apiUrl}/mi-horario/docente`);
  }
}

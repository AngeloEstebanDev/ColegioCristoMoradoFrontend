import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HorarioDocente, MiHorario } from '../models/mi-horario.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MiHorarioService {
  private http = inject(HttpClient);

  obtener(): Observable<MiHorario> {
    return this.http.get<MiHorario>(`${environment.apiUrl}/mi-horario`);
  }

  hijo(estudianteId: number): Observable<MiHorario> {
    return this.http.get<MiHorario>(`${environment.apiUrl}/mi-horario/hijos/${estudianteId}`);
  }

  docente(): Observable<HorarioDocente> {
    return this.http.get<HorarioDocente>(`${environment.apiUrl}/mi-horario/docente`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita, Disponibilidad, DisponibilidadRequest, HorarioLibre, PadreContacto, PersonaCita, Responsable } from '../models/cita.model';
import { environment } from '../../../environments/environment';

/** Mi Agenda: disponibilidad y citas. */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);
  /** Dirección base del backend para este servicio: /api/agenda. */
  private api = `${environment.apiUrl}/agenda`;

  // Disponibilidad (docentes, administración, directiva)
  disponibilidad(): Observable<Disponibilidad[]> { return this.http.get<Disponibilidad[]>(`${this.api}/disponibilidad`); }
  /**
   * Crea disponibilidad. Llama al backend: POST /api/agenda/disponibilidad. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  crearDisponibilidad(d: DisponibilidadRequest): Observable<Disponibilidad> {
    return this.http.post<Disponibilidad>(`${this.api}/disponibilidad`, d);
  }
  /**
   * Actualiza disponibilidad. Llama al backend: PUT /api/agenda/disponibilidad/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizarDisponibilidad(id: number, d: DisponibilidadRequest): Observable<Disponibilidad> {
    return this.http.put<Disponibilidad>(`${this.api}/disponibilidad/${id}`, d);
  }
  /**
   * Devuelve «estado disponibilidad». Llama al backend: PATCH /api/agenda/disponibilidad/{id}/estado.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  estadoDisponibilidad(id: number, activo: boolean): Observable<Disponibilidad> {
    return this.http.patch<Disponibilidad>(`${this.api}/disponibilidad/${id}/estado`, { estado: activo });
  }
  /**
   * Elimina disponibilidad. Llama al backend: DELETE /api/agenda/disponibilidad/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminarDisponibilidad(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/disponibilidad/${id}`); }
  /** Reemplaza toda la disponibilidad semanal (grilla de 15 minutos). */
  guardarSemana(bloques: { dia: number; horaInicio: string; horaFin: string }[]): Observable<Disponibilidad[]> {
    return this.http.put<Disponibilidad[]>(`${this.api}/disponibilidad/semana`, { bloques });
  }
  /** Horas de inicio libres del usuario logeado en una fecha. */
  misHorasLibres(fecha: string, duracion: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/mis-horas-libres`, { params: { fecha, duracion: String(duracion) } });
  }

  // Padre
  responsables(): Observable<Responsable[]> { return this.http.get<Responsable[]>(`${this.api}/responsables`); }
  /**
   * Devuelve «horarios». Llama al backend: GET /api/agenda/responsables/{responsableId}/horarios.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  horarios(responsableId: number): Observable<HorarioLibre[]> {
    return this.http.get<HorarioLibre[]>(`${this.api}/responsables/${responsableId}/horarios`);
  }
  /**
   * Solicita los datos de esta pantalla. Llama al backend: POST /api/agenda/citas/solicitar. Devuelve
   * un Observable (los datos llegan al hacer subscribe).
   */
  solicitar(datos: { responsableId: number; estudianteId: number | null; fecha: string; horaInicio: string; motivo: string; detalle?: string | null }): Observable<Cita> {
    return this.http.post<Cita>(`${this.api}/citas/solicitar`, datos);
  }

  // Responsable
  padres(): Observable<PadreContacto[]> { return this.http.get<PadreContacto[]>(`${this.api}/padres`); }
  /** Administración: padres, docentes y alumnos a los que puede citar. */
  personas(): Observable<PersonaCita[]> { return this.http.get<PersonaCita[]>(`${this.api}/personas`); }
  /**
   * Programa los datos de esta pantalla. Llama al backend: POST /api/agenda/citas. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  programar(datos: {
    padreId: number; estudianteId: number | null; fecha: string; horaInicio: string; horaFin: string | null;
    modalidad: string; lugar: string | null; motivo: string; duracionMinutos?: number | null; detalle?: string | null;
  }): Observable<Cita> {
    return this.http.post<Cita>(`${this.api}/citas`, datos);
  }

  // Citas
  citas(): Observable<Cita[]> { return this.http.get<Cita[]>(`${this.api}/citas`); }
  /**
   * Confirma los datos de esta pantalla. Llama al backend: PATCH /api/agenda/citas/{id}/confirmar.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  confirmar(id: number, motivo: string | null): Observable<Cita> { return this.http.patch<Cita>(`${this.api}/citas/${id}/confirmar`, { motivo }); }
  /**
   * Rechaza los datos de esta pantalla. Llama al backend: PATCH /api/agenda/citas/{id}/rechazar.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  rechazar(id: number, motivo: string): Observable<Cita> { return this.http.patch<Cita>(`${this.api}/citas/${id}/rechazar`, { motivo }); }
  /**
   * Cancela los datos de esta pantalla. Llama al backend: PATCH /api/agenda/citas/{id}/cancelar.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  cancelar(id: number, motivo: string): Observable<Cita> { return this.http.patch<Cita>(`${this.api}/citas/${id}/cancelar`, { motivo }); }
  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/agenda/citas/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/citas/${id}`); }
  /**
   * Devuelve «realizada». Llama al backend: PATCH /api/agenda/citas/{id}/realizada. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  realizada(id: number, motivo: string | null): Observable<Cita> { return this.http.patch<Cita>(`${this.api}/citas/${id}/realizada`, { motivo }); }
  /**
   * Reprograma los datos de esta pantalla. Llama al backend: PATCH /api/agenda/citas/{id}/reprogramar.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  reprogramar(id: number, datos: { fecha: string; horaInicio: string; horaFin: string | null; motivo: string }): Observable<Cita> {
    return this.http.patch<Cita>(`${this.api}/citas/${id}/reprogramar`, datos);
  }
}

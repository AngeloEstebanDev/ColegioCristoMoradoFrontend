import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CambiarPasswordRequest, CodigoEnviado, Perfil, PerfilUpdateRequest } from '../models/perfil.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio PerfilService: se comunica con el backend en /api/perfil (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class PerfilService {
  /** Dirección base del backend para este servicio: /api/perfil. */
  private apiUrl = `${environment.apiUrl}/perfil`;

  /** Foto del usuario logeado (la muestra el navbar). */
  readonly foto = signal<string | null>(null);

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Pide al backend un registro por su id. Llama al backend: GET /api/perfil/{usuarioId}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtener(usuarioId: number): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.apiUrl}/${usuarioId}`).pipe(tap(p => this.foto.set(p.foto ?? null)));
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/perfil/{usuarioId}.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  actualizar(usuarioId: number, datos: PerfilUpdateRequest): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/${usuarioId}`, datos).pipe(tap(p => this.foto.set(p.foto ?? null)));
  }

  /** Vincular Gmail, paso 1: envía un código al correo. */
  enviarCodigoCorreo(usuarioId: number, correo: string): Observable<CodigoEnviado> {
    return this.http.post<CodigoEnviado>(`${this.apiUrl}/${usuarioId}/correo/codigo`, { correo });
  }

  /** Vincular Gmail, paso 2: confirma el código. */
  verificarCorreo(usuarioId: number, codigo: string): Observable<Perfil> {
    return this.http.post<Perfil>(`${this.apiUrl}/${usuarioId}/correo/verificar`, { codigo });
  }

  /** Cambiar contraseña, paso 1: envía un código al Gmail verificado. */
  enviarCodigoPassword(usuarioId: number): Observable<CodigoEnviado> {
    return this.http.post<CodigoEnviado>(`${this.apiUrl}/${usuarioId}/password/codigo`, null);
  }

  /** Cambiar contraseña, paso 2: actual + nueva + código. */
  cambiarPassword(usuarioId: number, datos: CambiarPasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${usuarioId}/password`, datos);
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CambiarPasswordRequest, CodigoEnviado, Perfil, PerfilUpdateRequest } from '../models/perfil.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private apiUrl = `${environment.apiUrl}/perfil`;

  /** Foto del usuario logeado (la muestra el navbar). */
  readonly foto = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  obtener(usuarioId: number): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.apiUrl}/${usuarioId}`).pipe(tap(p => this.foto.set(p.foto ?? null)));
  }

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

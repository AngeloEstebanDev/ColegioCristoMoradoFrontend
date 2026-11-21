import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Observable } from 'rxjs';
import { Usuario, UsuarioRequest } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio UsuarioService: se comunica con el backend en /api/usuarios (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  /** Dirección base del backend para este servicio: /api/usuarios. */
  private apiUrl = `${environment.apiUrl}/usuarios`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient, private auth: AuthService) {}

  /** ?actorId= con el usuario logeado: el backend impide que modifique su propia cuenta. */
  private actor(): { params: HttpParams } {
    const id = this.auth.obtenerUsuario()?.id;
    return { params: id ? new HttpParams().set('actorId', id) : new HttpParams() };
  }

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/usuarios. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  /**
   * Pide al backend un registro por su id. Llama al backend: GET /api/usuarios/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  obtener(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envía al backend los datos para crear un registro nuevo. Llama al backend: POST /api/usuarios.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  crear(datos: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, datos, this.actor());
  }

  /**
   * Envía al backend los cambios de un registro. Llama al backend: PUT /api/usuarios/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  actualizar(id: number, datos: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datos, this.actor());
  }

  /**
   * Cambia estado. Llama al backend: PATCH /api/usuarios/{id}/estado. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  cambiarEstado(id: number, estado: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/estado`, { estado }, this.actor());
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/usuarios/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.actor());
  }
}

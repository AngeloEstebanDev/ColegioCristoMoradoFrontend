import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Observable } from 'rxjs';
import { Usuario, UsuarioRequest } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  /** ?actorId= con el usuario logeado: el backend impide que modifique su propia cuenta. */
  private actor(): { params: HttpParams } {
    const id = this.auth.obtenerUsuario()?.id;
    return { params: id ? new HttpParams().set('actorId', id) : new HttpParams() };
  }

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  crear(datos: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, datos, this.actor());
  }

  actualizar(id: number, datos: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, datos, this.actor());
  }

  cambiarEstado(id: number, estado: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/estado`, { estado }, this.actor());
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.actor());
  }
}

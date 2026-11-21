import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CodigoEnviado } from '../core/models/perfil.model';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  correoVerificado: boolean;
  rol: string;
  permisos?: string[] | null;
}

export type LoginResponse = Usuario;

const STORAGE_KEY = 'usuario';
const USUARIO_RECORDADO = 'usuario_recordado';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      datos
    ).pipe(
      tap((usuario) => this.guardarSesion(usuario))
    );
  }

  solicitarRecuperacion(usuario: string): Observable<CodigoEnviado> {
    return this.http.post<CodigoEnviado>(`${this.apiUrl}/recuperar/codigo`, { usuario });
  }

  restablecerPassword(usuario: string, codigo: string, passwordNueva: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/recuperar/restablecer`, { usuario, codigo, passwordNueva });
  }

  guardarSesion(usuario: Usuario): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  }

  obtenerUsuario(): Usuario | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as Usuario;
    } catch {
      return null;
    }
  }

  estaAutenticado(): boolean {
    return this.obtenerUsuario() !== null;
  }

  obtenerRol(): string {
    return this.obtenerUsuario()?.rol ?? '';
  }

  esAdministrador(): boolean {
    return ['admin', 'administrador'].includes(this.obtenerRol().toLowerCase());
  }

  esDirectiva(): boolean {
    return ['directivo', 'directiva', 'director'].includes(this.obtenerRol().toLowerCase());
  }

  tienePermiso(permiso: string): boolean {
    if (this.esAdministrador()) return true;
    if (!this.esDirectiva()) return false;
    return (this.obtenerUsuario()?.permisos ?? []).includes(permiso);
  }

  actualizarPermisos(permisos: string[]): void {
    const u = this.obtenerUsuario();
    if (u) this.guardarSesion({ ...u, permisos });
  }

  cerrarSesion(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  usuarioRecordado(): string {
    try { return localStorage.getItem(USUARIO_RECORDADO) ?? ''; } catch { return ''; }
  }

  recordarUsuario(usuario: string | null): void {
    try {
      if (usuario) localStorage.setItem(USUARIO_RECORDADO, usuario);
      else localStorage.removeItem(USUARIO_RECORDADO);
    } catch {  }
  }
}

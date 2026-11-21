import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CodigoEnviado } from '../core/models/perfil.model';
import { environment } from '../../environments/environment';

/** Modelo LoginRequest: describe la forma de los datos de «login request». */
export interface LoginRequest {
  usuario: string;     // ALU/DOC/APO/DIR + DNI (o el usuario de administración)
  password: string;
}

/** Modelo Usuario: describe la forma de los datos de «usuario». */
export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  correoVerificado: boolean;
  rol: string;
  /** Permisos del panel (el admin tiene todos; la Directiva, los que le asigne el admin). */
  permisos?: string[] | null;
}

// El backend devuelve la cuenta (sin contraseña) como respuesta del login.
export type LoginResponse = Usuario;

/** Constante STORAGE_KEY: valor fijo (storage key) que se reutiliza en varias partes. */
const STORAGE_KEY = 'usuario';
/**
 * Constante USUARIO_RECORDADO: valor fijo (usuario recordado) que se reutiliza en varias partes.
 */
const USUARIO_RECORDADO = 'usuario_recordado';

/**
 * Servicio AuthService: se comunica con el backend en /api/auth (envía y recibe JSON con HttpClient).
 * Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /** Dirección base del backend para este servicio: /api/auth. */
  private apiUrl = `${environment.apiUrl}/auth`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /**
   * Inicia sesión los datos de esta pantalla. Llama al backend: POST /api/auth/login. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      datos
    ).pipe(
      // Guardamos la sesión automáticamente al hacer login correcto.
      tap((usuario) => this.guardarSesion(usuario))
    );
  }

  /** "¿Olvidaste tu contraseña?" paso 1: envía un código al Gmail verificado. */
  solicitarRecuperacion(usuario: string): Observable<CodigoEnviado> {
    return this.http.post<CodigoEnviado>(`${this.apiUrl}/recuperar/codigo`, { usuario });
  }

  /** "¿Olvidaste tu contraseña?" paso 2: código + nueva contraseña. */
  restablecerPassword(usuario: string, codigo: string, passwordNueva: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/recuperar/restablecer`, { usuario, codigo, passwordNueva });
  }

  /**
   * Guarda sesión. Usa el localStorage del navegador para recordar datos aunque se recargue la página.
   */
  guardarSesion(usuario: Usuario): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  }

  /**
   * Obtiene usuario. Usa el localStorage del navegador para recordar datos aunque se recargue la
   * página.
   */
  obtenerUsuario(): Usuario | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as Usuario;
    } catch {
      return null;
    }
  }

  /** Indica si está autenticado (devuelve verdadero o falso). */
  estaAutenticado(): boolean {
    return this.obtenerUsuario() !== null;
  }

  /** Rol tal cual viene de la base de datos (columna `usuarios.rol`). */
  obtenerRol(): string {
    return this.obtenerUsuario()?.rol ?? '';
  }

  /** Indica si es administrador (devuelve verdadero o falso). */
  esAdministrador(): boolean {
    return ['admin', 'administrador'].includes(this.obtenerRol().toLowerCase());
  }

  /** Indica si es directiva (devuelve verdadero o falso). */
  esDirectiva(): boolean {
    return ['directivo', 'directiva', 'director'].includes(this.obtenerRol().toLowerCase());
  }

  /** ¿Puede usar este módulo del panel? El administrador siempre; la Directiva según sus permisos. */
  tienePermiso(permiso: string): boolean {
    if (this.esAdministrador()) return true;
    if (!this.esDirectiva()) return false;
    return (this.obtenerUsuario()?.permisos ?? []).includes(permiso);
  }

  /** Actualiza los permisos guardados en la sesión (el admin pudo cambiarlos). */
  actualizarPermisos(permisos: string[]): void {
    const u = this.obtenerUsuario();
    if (u) this.guardarSesion({ ...u, permisos });
  }

  /**
   * Cierra sesión. Usa el localStorage del navegador para recordar datos aunque se recargue la página.
   */
  cerrarSesion(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // --- "Guardar contraseña": se recuerda solo el USUARIO en este equipo;
  //     la contraseña la guarda el gestor de contraseñas del navegador. ---

  usuarioRecordado(): string {
    try { return localStorage.getItem(USUARIO_RECORDADO) ?? ''; } catch { return ''; }
  }

  /**
   * Realiza la acción «recordar usuario» de esta pantalla. Usa el localStorage del navegador para
   * recordar datos aunque se recargue la página.
   */
  recordarUsuario(usuario: string | null): void {
    try {
      if (usuario) localStorage.setItem(USUARIO_RECORDADO, usuario);
      else localStorage.removeItem(USUARIO_RECORDADO);
    } catch { /* almacenamiento no disponible */ }
  }
}

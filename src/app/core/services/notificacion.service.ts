import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Notificaciones } from '../models/mensaje.model';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

/**
 * Contador de la campana del navbar (comunicados + mensajes sin leer).
 * Las vistas llaman a refrescar() después de marcar algo como leído.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  /** Dirección base del backend para este servicio: /api/notificaciones. */
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  /** Estado (signal): datos. */
  readonly datos = signal<Notificaciones>({ comunicadosNoLeidos: 0, mensajesNoLeidos: 0, total: 0 });

  /** function Object() { [native code] } */
  constructor(private http: HttpClient, private auth: AuthService) {}

  /**
   * Realiza la acción «refrescar» de esta pantalla. Llama al backend: GET /api/notificaciones/{id}.
   * Devuelve un Observable (los datos llegan al hacer subscribe).
   */
  refrescar(): void {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario) return;
    this.http.get<Notificaciones>(`${this.apiUrl}/${usuario.id}`).subscribe({
      next: (n) => this.datos.set(n),
      error: () => { /* sin conexión: se deja el último valor */ },
    });
  }
}

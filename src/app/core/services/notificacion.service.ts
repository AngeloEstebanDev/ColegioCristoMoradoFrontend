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
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  readonly datos = signal<Notificaciones>({ comunicadosNoLeidos: 0, mensajesNoLeidos: 0, total: 0 });

  constructor(private http: HttpClient, private auth: AuthService) {}

  refrescar(): void {
    const usuario = this.auth.obtenerUsuario();
    if (!usuario) return;
    this.http.get<Notificaciones>(`${this.apiUrl}/${usuario.id}`).subscribe({
      next: (n) => this.datos.set(n),
      error: () => { /* sin conexión: se deja el último valor */ },
    });
  }
}

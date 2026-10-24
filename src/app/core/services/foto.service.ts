import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Fotos de perfil de todos los usuarios para los avatares del sistema.
 * Se pide una sola vez el índice {usuarioId: versión o ruta de avatar} (solo quienes tienen foto)
 * y cada imagen se descarga de /api/fotos/{id}?v=... (queda en la caché del navegador).
 */
@Injectable({ providedIn: 'root' })
export class FotoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fotos`;

  private indice = signal<Record<string, string>>({});
  private pedido = false;

  /** Carga el índice (una vez). forzar = volver a pedirlo, por ejemplo tras cambiar la propia foto. */
  cargar(forzar = false): void {
    if (this.pedido && !forzar) return;
    this.pedido = true;
    this.http.get<Record<string, string>>(this.apiUrl).subscribe({
      next: (i) => this.indice.set(i ?? {}),
      error: () => { this.pedido = false; },
    });
  }

  /** URL de la foto del usuario, la ruta de su avatar del colegio, o null si no tiene. */
  src(usuarioId: number | null | undefined): string | null {
    if (usuarioId == null || usuarioId <= 0) return null;
    const v = this.indice()[String(usuarioId)];
    if (!v) return null;
    return v.startsWith('v') ? `${this.apiUrl}/${usuarioId}?v=${v.slice(1, 13)}` : v;
  }
}

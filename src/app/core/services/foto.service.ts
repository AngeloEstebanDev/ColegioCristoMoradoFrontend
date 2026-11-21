import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FotoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fotos`;

  private indice = signal<Record<string, string>>({});
  private pedido = false;

  cargar(forzar = false): void {
    if (this.pedido && !forzar) return;
    this.pedido = true;
    this.http.get<Record<string, string>>(this.apiUrl).subscribe({
      next: (i) => this.indice.set(i ?? {}),
      error: () => { this.pedido = false; },
    });
  }

  src(usuarioId: number | null | undefined): string | null {
    if (usuarioId == null || usuarioId <= 0) return null;
    const v = this.indice()[String(usuarioId)];
    if (!v) return null;
    return v.startsWith('v') ? `${this.apiUrl}/${usuarioId}?v=${v.slice(1, 13)}` : v;
  }
}

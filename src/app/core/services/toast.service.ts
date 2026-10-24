import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info' | 'aviso';

export interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
  ms: number;
}

/**
 * Notificaciones del sistema: una ventanita pequeña arriba de la pantalla que se cierra sola.
 * Uso: inject(ToastService).exito('Guardado'), .error('...'), .info('...'), .aviso('...').
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly lista = signal<Toast[]>([]);
  private seq = 0;

  mostrar(texto: string | null | undefined, tipo: TipoToast = 'exito', ms?: number): void {
    if (!texto) return;
    const duracion = ms ?? (tipo === 'error' ? 6000 : Math.min(9000, 3500 + texto.length * 25));
    const t: Toast = { id: ++this.seq, tipo, texto, ms: duracion };
    // Máximo 4 a la vez; no repite el mismo mensaje seguido.
    this.lista.update(l => [...l.filter(x => x.texto !== texto), t].slice(-4));
    setTimeout(() => this.cerrar(t.id), duracion);
  }

  exito(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'exito', ms); }
  error(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'error', ms); }
  info(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'info', ms); }
  aviso(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'aviso', ms); }

  cerrar(id: number): void {
    this.lista.update(l => l.filter(x => x.id !== id));
  }
}

import { Injectable, signal } from '@angular/core';

/** Tipo TipoToast: describe la forma de los datos de «tipo toast». */
export type TipoToast = 'exito' | 'error' | 'info' | 'aviso';

/** Modelo Toast: describe la forma de los datos de «toast». */
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
  /** Estado (signal): lista. */
  readonly lista = signal<Toast[]>([]);
  private seq = 0;

  /** Muestra los datos de esta pantalla. */
  mostrar(texto: string | null | undefined, tipo: TipoToast = 'exito', ms?: number): void {
    if (!texto) return;
    const duracion = ms ?? (tipo === 'error' ? 6000 : Math.min(9000, 3500 + texto.length * 25));
    const t: Toast = { id: ++this.seq, tipo, texto, ms: duracion };
    // Máximo 4 a la vez; no repite el mismo mensaje seguido.
    this.lista.update(l => [...l.filter(x => x.texto !== texto), t].slice(-4));
    setTimeout(() => this.cerrar(t.id), duracion);
  }

  /** Realiza la acción «éxito» de esta pantalla. */
  exito(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'exito', ms); }
  /** Realiza la acción «error» de esta pantalla. */
  error(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'error', ms); }
  /** Realiza la acción «info» de esta pantalla. */
  info(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'info', ms); }
  /** Realiza la acción «aviso» de esta pantalla. */
  aviso(texto: string | null | undefined, ms?: number): void { this.mostrar(texto, 'aviso', ms); }

  /** Cierra los datos de esta pantalla. */
  cerrar(id: number): void {
    this.lista.update(l => l.filter(x => x.id !== id));
  }
}

import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo?: string;
  aceptar?: string;
  cancelar?: string;
  /** Acción que borra o desactiva algo (botón rojo). Se deduce del texto si no se indica. */
  peligro?: boolean;
}

interface Pedido extends Required<OpcionesConfirmacion> {
  texto: string;
  resolver: (ok: boolean) => void;
}

/**
 * Ventana de confirmación del sistema (reemplaza al confirm() del navegador).
 * Uso: if (!(await this.confirmar.pedir('¿Enviar tu entrega?'))) return;
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly actual = signal<Pedido | null>(null);

  pedir(texto: string, op: OpcionesConfirmacion = {}): Promise<boolean> {
    this.actual()?.resolver(false);
    const peligro = op.peligro ?? /^¿?\s*(eliminar|desactivar|quitar|retirar|vaciar|cerrar sesi)/i.test(texto);
    return new Promise<boolean>(resolver => this.actual.set({
      texto, resolver,
      titulo: op.titulo ?? (peligro ? 'Confirmar acción' : 'Confirmar'),
      aceptar: op.aceptar ?? (peligro ? 'Sí, continuar' : 'Aceptar'),
      cancelar: op.cancelar ?? 'Cancelar',
      peligro,
    }));
  }

  responder(ok: boolean): void {
    const p = this.actual();
    if (!p) return;
    this.actual.set(null);
    p.resolver(ok);
  }
}

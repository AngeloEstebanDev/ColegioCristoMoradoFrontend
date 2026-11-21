import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo?: string;
  aceptar?: string;
  cancelar?: string;
  peligro?: boolean;
}

interface Pedido extends Required<OpcionesConfirmacion> {
  texto: string;
  resolver: (ok: boolean) => void;
}

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

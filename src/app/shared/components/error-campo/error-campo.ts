import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { mensajeError } from '../../../core/utils/validadores';

/**
 * Muestra bajo un campo el mensaje de su primer error, solo cuando el usuario
 * ya lo tocó o escribió en él. Uso: <app-error-campo [control]="form.get('telefono')" />
 * Escucha los eventos del control (valor, estado, tocado), así se actualiza al instante.
 */
@Component({
  selector: 'app-error-campo',
  template: `
    @if (mensaje(); as m) {
      <p class="mt-1 text-[11.5px] leading-snug text-[#A62639]" role="alert">{{ m }}</p>
    }
  `,
})
export class ErrorCampo {
  control = input<AbstractControl | null | undefined>(null);
  protected mensaje = signal<string | null>(null);
  private sub?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.sub?.unsubscribe());
    effect(() => {
      const c = this.control();
      this.sub?.unsubscribe();
      this.actualizar(c);
      this.sub = c?.events.subscribe(() => this.actualizar(c));
    });
  }

  private actualizar(c: AbstractControl | null | undefined): void {
    this.mensaje.set(c && c.invalid && (c.touched || c.dirty) ? mensajeError(c) : null);
  }
}

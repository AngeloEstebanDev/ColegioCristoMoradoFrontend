import { Directive, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Limita lo que se puede escribir en un campo mientras el usuario teclea o pega:
 *   appFiltro="digitos"  -> solo números (con [maximo] = cantidad máxima, ej. 9 para teléfono)
 *   appFiltro="letras"   -> solo letras, espacios, apóstrofo, punto y guion (nombres y apellidos)
 *   appFiltro="usuario"  -> letras, números, punto, guion y guion bajo (sin espacios)
 * Funciona con formControlName y con ngModel.
 */
@Directive({ selector: 'input[appFiltro]' })
export class FiltroEntrada {
  appFiltro = input.required<'digitos' | 'letras' | 'usuario'>();
  maximo = input<number | null>(null);
  private control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  alEscribir(e: Event): void {
    const el = e.target as HTMLInputElement;
    const antes = el.value;
    let v = antes;
    switch (this.appFiltro()) {
      case 'digitos': v = v.replace(/\D/g, ''); break;
      case 'letras': v = v.replace(/[^\p{L} .'’-]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' '); break;
      case 'usuario': v = v.replace(/[^A-Za-z0-9._-]/g, ''); break;
    }
    const max = this.maximo();
    if (max && v.length > max) v = v.slice(0, max);
    if (v !== antes) {
      el.value = v;
      this.control?.control?.setValue(v);
    }
  }
}

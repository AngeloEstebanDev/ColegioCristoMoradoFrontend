import { Component, Input, forwardRef, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Campo de contraseña con botón "mostrar / ocultar".
 * Funciona con formControlName y con [(ngModel)]:
 *   <app-campo-password formControlName="password" placeholder="..." />
 */
@Component({
  selector: 'app-campo-password',
  standalone: true,
  imports: [NgClass],
  templateUrl: './campo-password.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoPassword), multi: true }],
})
export class CampoPassword implements ControlValueAccessor {

  @Input() placeholder = '';
  @Input() autocomplete = 'current-password';
  @Input() inputId = '';
  @Input() nombre = '';
  /** Marca el borde en rojo (p.ej. "Contraseña incorrecta"). */
  @Input() invalido = false;
  /** Clases de tamaño/estilo del input (para igualar el diseño de cada pantalla). */
  @Input() claseInput = 'px-3 py-2.5 text-[13.5px] rounded-lg bg-white';

  visible = signal(false);
  valor = signal('');
  deshabilitado = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  escribir(v: string): void {
    this.valor.set(v);
    this.onChange(v);
  }

  writeValue(v: string | null): void { this.valor.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.deshabilitado.set(d); }
}

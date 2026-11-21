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

  /** Estado (signal): visible. */
  visible = signal(false);
  /** Estado (signal): valor. */
  valor = signal('');
  /** Estado (signal): deshabilitado. */
  deshabilitado = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  /** Escribe los datos de esta pantalla. */
  escribir(v: string): void {
    this.valor.set(v);
    this.onChange(v);
  }

  /** Recibe el valor que viene del formulario (ControlValueAccessor). */
  writeValue(v: string | null): void { this.valor.set(v ?? ''); }
  /** Registra la función que avisa al formulario cuando cambia el valor. */
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  /** Registra la función que avisa al formulario cuando el campo fue tocado. */
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  /** Habilita o deshabilita el campo. */
  setDisabledState(d: boolean): void { this.deshabilitado.set(d); }
}

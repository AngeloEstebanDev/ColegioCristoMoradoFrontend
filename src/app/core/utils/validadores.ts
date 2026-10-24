import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Reglas de validación de campos del sistema. Son las mismas que aplica el backend
 * (util/Campos.java), así el usuario ve el error antes de enviar el formulario.
 *
 * Cada validador devuelve { campo: 'mensaje' } para que <app-error-campo> lo muestre.
 */

const LETRAS = /^[\p{L}][\p{L} .'’-]*$/u;
const CORREO = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const vacio = (v: unknown) => v === null || v === undefined || String(v).trim() === '';
const err = (mensaje: string): ValidationErrors => ({ campo: mensaje });

/** Solo los dígitos de un teléfono (quita espacios y guiones). */
export function soloDigitos(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '');
}

/** Quita espacios al inicio y al final y deja uno solo entre palabras. */
export function limpiarTexto(v: string | null | undefined): string {
  return (v ?? '').trim().replace(/\s+/g, ' ');
}

/** Edad cumplida en años a partir de una fecha ISO (yyyy-MM-dd). */
export function edad(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  let e = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e;
}

export const Val = {
  /** Celular de 9 dígitos que empieza con 9. */
  telefono(obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const t = String(c.value ?? '').replace(/[\s-]/g, '');
      if (!t) return obligatorio ? err('El teléfono es obligatorio.') : null;
      if (!/^\d+$/.test(t)) return err('El teléfono solo puede tener números.');
      if (t.length !== 9) return err('El teléfono debe tener 9 dígitos.');
      if (t[0] !== '9') return err('El teléfono debe empezar con 9 (celular).');
      return null;
    };
  },

  /** Nombre completo de persona: nombre y apellido, solo letras, 5 a 100 caracteres. */
  nombreCompleto(): ValidatorFn {
    return (c: AbstractControl) => {
      const n = limpiarTexto(c.value);
      if (!n) return err('Escribe el nombre completo.');
      if (!LETRAS.test(n)) return err('El nombre solo puede tener letras y espacios.');
      if (n.split(' ').length < 2) return err('Escribe el nombre y al menos un apellido.');
      if (n.length < 5 || n.length > 100) return err('El nombre debe tener entre 5 y 100 caracteres.');
      return null;
    };
  },

  /** Nombres, un apellido, nacionalidad…: solo letras, 2 a max caracteres. */
  letras(etiqueta: string, max: number, obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = limpiarTexto(c.value);
      if (!v) return obligatorio ? err(`Escribe ${etiqueta}.`) : null;
      if (!LETRAS.test(v)) return err(`En ${etiqueta} solo se permiten letras y espacios.`);
      if (v.length < 2 || v.length > max) return err(`En ${etiqueta} escribe entre 2 y ${max} caracteres.`);
      return null;
    };
  },

  /** Correo con formato usuario@dominio.ext (hasta 150 caracteres). */
  correo(obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return obligatorio ? err('Escribe el correo.') : null;
      if (v.length > 150) return err('El correo no puede superar los 150 caracteres.');
      return CORREO.test(v) ? null : err('El correo no es válido (ejemplo: nombre@gmail.com).');
    };
  },

  /** Texto libre con longitud mínima y máxima. */
  texto(etiqueta: string, min: number, max: number, obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return obligatorio ? err(`Escribe ${etiqueta}.`) : null;
      if (v.length < min) return err(`${may(etiqueta)} debe tener al menos ${min} caracteres.`);
      if (v.length > max) return err(`${may(etiqueta)} admite hasta ${max} caracteres.`);
      return null;
    };
  },

  /** Fecha de nacimiento: no futura y edad entre min y max años. */
  fechaNacimiento(min: number, max: number, obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = c.value as string;
      if (vacio(v)) return obligatorio ? err('Indica la fecha de nacimiento.') : null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return err('Fecha no válida.');
      const e = edad(v);
      if (e < 0) return err('La fecha de nacimiento no puede ser futura.');
      if (e < min || e > max) return err(`Revisa la fecha de nacimiento: la edad debe estar entre ${min} y ${max} años.`);
      return null;
    };
  },

  /** Fecha que no puede ser futura. */
  noFutura(etiqueta: string): ValidatorFn {
    return (c: AbstractControl) => {
      const v = c.value as string;
      if (vacio(v)) return null;
      const hoy = new Date();
      const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      return v > iso ? err(`${may(etiqueta)} no puede ser futura.`) : null;
    };
  },

  /** Fecha que no puede ser pasada (hoy o después). */
  noPasada(etiqueta: string): ValidatorFn {
    return (c: AbstractControl) => {
      const v = c.value as string;
      if (vacio(v)) return null;
      const hoy = new Date();
      const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      return v.slice(0, 10) < iso ? err(`${may(etiqueta)} no puede ser una fecha pasada.`) : null;
    };
  },

  /** Número (entero si entero = true) entre min y max. */
  numero(etiqueta: string, min: number, max: number, obligatorio = false, entero = true): ValidatorFn {
    return (c: AbstractControl) => {
      const v = c.value;
      if (vacio(v)) return obligatorio ? err(`Escribe ${etiqueta}.`) : null;
      const n = Number(v);
      if (Number.isNaN(n)) return err(`${may(etiqueta)} debe ser un número.`);
      if (entero && !Number.isInteger(n)) return err(`${may(etiqueta)} debe ser un número entero.`);
      if (n < min || n > max) return err(`${may(etiqueta)} debe estar entre ${min} y ${max}.`);
      return null;
    };
  },

  /** Contraseña: 4 a 64 caracteres y sin espacios (vacía se acepta si no es obligatoria). */
  password(obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '');
      if (!v) return obligatorio ? err('Escribe la contraseña.') : null;
      if (v.length < 4) return err('La contraseña debe tener al menos 4 caracteres.');
      if (v.length > 64) return err('La contraseña admite hasta 64 caracteres.');
      if (/\s/.test(v)) return err('La contraseña no puede tener espacios.');
      return null;
    };
  },

  /** Usuario de acceso (administración): 3 a 30 letras, números, punto, guion o guion bajo. */
  usuario(): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return err('Escribe el usuario.');
      return /^[A-Za-z0-9._-]{3,30}$/.test(v) ? null
        : err('El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo (sin espacios).');
    };
  },

  /** Enlace web que empieza con http:// o https:// (hasta 500 caracteres). */
  enlace(obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return obligatorio ? err('Escribe el enlace.') : null;
      if (v.length > 500) return err('El enlace es demasiado largo.');
      return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v) ? null : err('El enlace debe empezar con http:// o https:// (ejemplo: https://www.youtube.com/...).');
    };
  },
};

function may(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Primer mensaje de error de un control (para mostrarlo bajo el campo). */
export function mensajeError(c: AbstractControl | null | undefined): string | null {
  const e = c?.errors;
  if (!e) return null;
  if (e['campo']) return e['campo'];
  if (e['required']) return 'Este campo es obligatorio.';
  if (e['minlength']) return `Escribe al menos ${e['minlength'].requiredLength} caracteres.`;
  if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
  if (e['min']) return `El valor mínimo es ${e['min'].min}.`;
  if (e['max']) return `El valor máximo es ${e['max'].max}.`;
  if (e['email']) return 'El correo no es válido.';
  if (e['pattern']) return 'El formato no es válido.';
  return 'Revisa este campo.';
}

/**
 * Para formularios hechos con signals/ngModel: aplica los validadores a un valor
 * y devuelve el primer mensaje de error (o null si está bien).
 *   const e = revisar(f.telefono, Val.telefono());
 */
export function revisar(valor: unknown, ...reglas: ValidatorFn[]): string | null {
  const c = { value: valor } as AbstractControl;
  for (const r of reglas) {
    const e = r(c);
    if (e) return mensajeError({ errors: e } as AbstractControl);
  }
  return null;
}

/** Revisa varios campos en orden y devuelve el primer error encontrado. */
export function primerError(...resultados: (string | null)[]): string | null {
  return resultados.find(r => !!r) ?? null;
}

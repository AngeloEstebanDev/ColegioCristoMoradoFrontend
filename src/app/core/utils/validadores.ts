import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const LETRAS = /^[\p{L}][\p{L} .'’-]*$/u;
const CORREO = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const vacio = (v: unknown) => v === null || v === undefined || String(v).trim() === '';
const err = (mensaje: string): ValidationErrors => ({ campo: mensaje });

export function soloDigitos(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '');
}

export function limpiarTexto(v: string | null | undefined): string {
  return (v ?? '').trim().replace(/\s+/g, ' ');
}

export function edad(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  let e = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--;
  return e;
}

export const Val = {
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

  letras(etiqueta: string, max: number, obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = limpiarTexto(c.value);
      if (!v) return obligatorio ? err(`Escribe ${etiqueta}.`) : null;
      if (!LETRAS.test(v)) return err(`En ${etiqueta} solo se permiten letras y espacios.`);
      if (v.length < 2 || v.length > max) return err(`En ${etiqueta} escribe entre 2 y ${max} caracteres.`);
      return null;
    };
  },

  correo(obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return obligatorio ? err('Escribe el correo.') : null;
      if (v.length > 150) return err('El correo no puede superar los 150 caracteres.');
      return CORREO.test(v) ? null : err('El correo no es válido (ejemplo: nombre@gmail.com).');
    };
  },

  texto(etiqueta: string, min: number, max: number, obligatorio = false): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return obligatorio ? err(`Escribe ${etiqueta}.`) : null;
      if (v.length < min) return err(`${may(etiqueta)} debe tener al menos ${min} caracteres.`);
      if (v.length > max) return err(`${may(etiqueta)} admite hasta ${max} caracteres.`);
      return null;
    };
  },

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

  noFutura(etiqueta: string): ValidatorFn {
    return (c: AbstractControl) => {
      const v = c.value as string;
      if (vacio(v)) return null;
      const hoy = new Date();
      const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      return v > iso ? err(`${may(etiqueta)} no puede ser futura.`) : null;
    };
  },

  noPasada(etiqueta: string): ValidatorFn {
    return (c: AbstractControl) => {
      const v = c.value as string;
      if (vacio(v)) return null;
      const hoy = new Date();
      const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      return v.slice(0, 10) < iso ? err(`${may(etiqueta)} no puede ser una fecha pasada.`) : null;
    };
  },

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

  usuario(): ValidatorFn {
    return (c: AbstractControl) => {
      const v = String(c.value ?? '').trim();
      if (!v) return err('Escribe el usuario.');
      return /^[A-Za-z0-9._-]{3,30}$/.test(v) ? null
        : err('El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo (sin espacios).');
    };
  },

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

export function revisar(valor: unknown, ...reglas: ValidatorFn[]): string | null {
  const c = { value: valor } as AbstractControl;
  for (const r of reglas) {
    const e = r(c);
    if (e) return mensajeError({ errors: e } as AbstractControl);
  }
  return null;
}

export function primerError(...resultados: (string | null)[]): string | null {
  return resultados.find(r => !!r) ?? null;
}

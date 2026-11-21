import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE' | 'OTRO';

export interface InfoDocumento {
  valor: TipoDocumento;
  nombre: string;
  corto: string;
  max: number;
  ayuda: string;
  patron: RegExp;
  error: string;
}

export const TIPOS_DOCUMENTO: InfoDocumento[] = [
  { valor: 'DNI', nombre: 'DNI', corto: 'DNI', max: 8, ayuda: '8 dígitos',
    patron: /^\d{8}$/, error: 'El DNI debe tener 8 dígitos.' },
  { valor: 'CE', nombre: 'Carné de Extranjería', corto: 'CE', max: 12, ayuda: '9 a 12 caracteres',
    patron: /^[0-9A-Z]{9,12}$/, error: 'El carné de extranjería debe tener entre 9 y 12 caracteres (números o letras).' },
  { valor: 'PASAPORTE', nombre: 'Pasaporte', corto: 'PAS', max: 12, ayuda: '6 a 12 caracteres',
    patron: /^[0-9A-Z]{6,12}$/, error: 'El pasaporte debe tener entre 6 y 12 caracteres (números o letras).' },
  { valor: 'OTRO', nombre: 'Otro documento', corto: 'OTRO', max: 15, ayuda: '6 a 15 caracteres',
    patron: /^[0-9A-Z]{6,15}$/, error: 'El número de documento debe tener entre 6 y 15 caracteres (números o letras).' },
];

export function infoDocumento(tipo: string | null | undefined): InfoDocumento {
  return TIPOS_DOCUMENTO.find(t => t.valor === (tipo || 'DNI')) ?? TIPOS_DOCUMENTO[0];
}

export function limpiarDocumento(numero: string | null | undefined): string {
  return (numero ?? '').replace(/\s/g, '').toUpperCase();
}

export function errorDocumento(tipo: string | null | undefined, numero: string | null | undefined): string | null {
  const n = limpiarDocumento(numero);
  if (!n) return 'Escribe el número de documento.';
  const info = infoDocumento(tipo);
  return info.patron.test(n) ? null : info.error;
}

export function validadorDocumento(campoTipo = 'tipoDocumento', campoNumero = 'dni'): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const tipo = grupo.get(campoTipo)?.value;
    const numero = grupo.get(campoNumero)?.value;
    const msg = errorDocumento(tipo, numero);
    return msg ? { documento: msg } : null;
  };
}

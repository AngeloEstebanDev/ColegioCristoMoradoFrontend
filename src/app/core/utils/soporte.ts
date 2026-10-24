import { environment } from '../../../environments/environment';

/** Número de soporte para mostrar: "+51 983 046 253". */
export const SOPORTE_TELEFONO = '+' + environment.soporteWhatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');

/** Enlace de WhatsApp a soporte con un mensaje ya escrito (abre la app o WhatsApp Web). */
export function enlaceSoporte(mensaje = 'Hola, necesito ayuda con el Portal de la I.E. 2092 Cristo Morado.'): string {
  return `https://wa.me/${environment.soporteWhatsapp}?text=${encodeURIComponent(mensaje)}`;
}

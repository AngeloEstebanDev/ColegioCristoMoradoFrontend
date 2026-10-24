/**
 * Configuración de PRODUCCIÓN (ng build / Vercel).
 * Cambia apiUrl por la URL que te da Render para la API, terminando en /api.
 */
export const environment = {
  production: true,
  /** WhatsApp de soporte (código de país + número, sin + ni espacios). */
  soporteWhatsapp: '51983046253',
  apiUrl: 'https://colegiocristomoradobackend.onrender.com/api',
};

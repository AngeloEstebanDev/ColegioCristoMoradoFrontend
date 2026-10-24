/** "Hace 5 minutos", "Hace 2 horas", "Ayer", "22 sep 2026"... */
export function haceCuanto(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  const seg = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seg < 60) return 'Hace un momento';
  const min = Math.floor(seg / 60);
  if (min < 60) return `Hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Texto plano (sin etiquetas HTML) para las vistas previas de las tarjetas. */
export function textoPlano(html: string | null | undefined): string {
  if (!html) return '';
  const div = document.createElement('div');
  // Cada salto de línea / párrafo / ítem de lista se vuelve un espacio,
  // para que no se peguen las palabras de líneas distintas.
  div.innerHTML = html.replace(/<\/?(br|p|div|li|ul|ol|h[1-6])\b[^>]*>/gi, ' $&');
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function iniciales(nombre: string | null | undefined): string {
  return (nombre ?? '?').split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase() || '?';
}

/** Año (número) de una fecha ISO. */
export function anioDe(fecha: string): number {
  return new Date(fecha).getFullYear();
}

/** Categoría del rol del usuario logeado. */
export function esAdministrativo(rol: string | null | undefined): boolean {
  return ['admin', 'administrador', 'directivo', 'director', 'secretaria'].includes((rol ?? '').toLowerCase());
}

/** "22 de septiembre de 2026, 19:30" (en español, sin depender del LOCALE_ID). */
export function fechaLarga(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  const dia = d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const hora = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${hora}`;
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** "2026-10-06" (fecha local de hoy). */
export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "yyyy-MM-dd" -> "mar 06 oct 2026" (sin problemas de zona horaria). */
export function fechaCorta(iso: string | null | undefined, conDia = false): string {
  if (!iso) return '';
  const [a, m, d] = iso.substring(0, 10).split('-').map(Number);
  const dia = new Date(a, m - 1, d).getDay();
  return `${conDia ? DIAS_CORTOS[dia] + ' ' : ''}${String(d).padStart(2, '0')} ${MESES_CORTOS[m - 1]} ${a}`;
}

/** Fecha y hora ISO local "2026-10-06T23:59:00" -> "06 oct 2026, 23:59". */
export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '';
  const hora = iso.length >= 16 ? iso.substring(11, 16) : '';
  return `${fechaCorta(iso)}${hora ? ', ' + hora : ''}`;
}

/** Tiempo restante hasta una fecha ISO: "Vence en 2 días", "Venció hace 3 horas". */
export function plazo(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000), h = Math.round(abs / 3600000), d = Math.round(abs / 86400000);
  const txt = min < 60 ? `${min} min` : h < 48 ? `${h} ${h === 1 ? 'hora' : 'horas'}` : `${d} días`;
  return diff >= 0 ? `Vence en ${txt}` : `Venció hace ${txt}`;
}

/** 12.5 -> "12.5", 12 -> "12", null -> "—" */
export function num(v: number | null | undefined, decimales = 2): string {
  if (v === null || v === undefined) return '—';
  return Number.isInteger(v) ? String(v) : v.toFixed(decimales).replace(/0+$/, '').replace(/\.$/, '');
}

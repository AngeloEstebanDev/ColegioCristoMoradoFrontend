import { MAX_FILAS_PDF, TablaReporte } from '../models/reporte.model';

const MORADO: [number, number, number] = [74, 31, 82];
const COLORES_ESTADO: Record<string, [number, number, number]> = {
  'Asistió': [30, 122, 59], 'Tardanza': [176, 110, 0], 'Falta': [166, 38, 57], 'Justificada': [37, 99, 235],
};

/** "Registro de notas - 5° Primaria A" -> "Registro_de_notas_5_Primaria_A_2026-10-20.pdf" */
export function nombreArchivo(titulo: string, extension: 'pdf' | 'xlsx'): string {
  const base = (titulo || 'Reporte').normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${base || 'Reporte'}_${hoy}.${extension}`;
}

async function logo(): Promise<string | null> {
  try {
    const r = await fetch('logo-cristo-morado.png');
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result as string); f.onerror = () => res(null); f.readAsDataURL(blob); });
  } catch { return null; }
}

/**
 * Genera y descarga el PDF de un reporte (A4 horizontal, encabezado del colegio, indicadores,
 * tabla con encabezado repetido en cada página y número de página).
 * Devuelve true si el PDF se recortó a MAX_FILAS_PDF filas.
 */
export async function descargarPdf(t: TablaReporte, nombre?: string): Promise<boolean> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const img = await logo();
  if (img) doc.addImage(img, 'PNG', 14, 9, 16, 16);
  doc.setTextColor(...MORADO);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('I.E. N.° 2092 CRISTO MORADO', 34, 13);
  doc.setFontSize(15); doc.text(t.titulo, 34, 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 80, 90);
  doc.text(t.subtitulo ?? '', 34, 25.5);
  const indicadores = (t.indicadores ?? []).filter(i => i.etiqueta !== 'Filas mostradas').map(i => `${i.etiqueta}: ${i.valor}`).join('   ·   ');
  if (indicadores) doc.text(doc.splitTextToSize(indicadores, ancho - 28), 14, 32);

  const recortado = t.filas.length > MAX_FILAS_PDF;
  const filas = (recortado ? t.filas.slice(0, MAX_FILAS_PDF) : t.filas)
    .map(f => f.map(v => typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : String(v ?? '')));
  const colEstado = t.columnas.indexOf('Estado de asistencia');
  autoTable(doc, {
    head: [t.columnas],
    body: filas.length ? filas : [[{ content: 'No hay registros con los filtros elegidos.', colSpan: t.columnas.length, styles: { halign: 'center', textColor: [107, 90, 103] } }]],
    startY: indicadores ? 37 : 31,
    margin: { left: 14, right: 14, bottom: 14 },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.6, lineColor: [227, 213, 196], lineWidth: 0.1, textColor: [36, 21, 33] },
    headStyles: { fillColor: MORADO, textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [250, 246, 239] },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === colEstado && COLORES_ESTADO[String(d.cell.raw)]) {
        d.cell.styles.textColor = COLORES_ESTADO[String(d.cell.raw)];
        d.cell.styles.fontStyle = 'bold';
      }
      if (d.section === 'body' && typeof d.cell.raw === 'string' && /^\d+(\.\d+)?$/.test(d.cell.raw)) d.cell.styles.halign = 'center';
    },
  });
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(120);
    const pie = recortado ? `Se incluyen las primeras ${MAX_FILAS_PDF} filas de ${t.filas.length}. ` : '';
    doc.text(`${pie}Página ${i} de ${paginas}`, ancho - 14, doc.internal.pageSize.getHeight() - 7, { align: 'right' });
  }
  doc.save(nombreArchivo(nombre || t.titulo, 'pdf'));
  return recortado;
}

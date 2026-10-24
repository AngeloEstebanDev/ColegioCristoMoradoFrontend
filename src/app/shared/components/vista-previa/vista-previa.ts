import { Component, DestroyRef, ViewEncapsulation, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ArchivoInfo, ArchivoNuevo } from '../../../core/models/aula.model';
import { ArchivoService, extension, guardarBlob, tamanioLegible } from '../../../core/services/archivo.service';
import { environment } from '../../../../environments/environment';

/** Cómo se muestra cada formato dentro del sistema. */
type Clase = 'pdf' | 'imagen' | 'video' | 'audio' | 'texto' | 'docx' | 'hoja' | 'pptx' | 'ninguna';

interface Diapositiva { numero: number; titulo: string; textos: string[]; imagenes: string[]; }

const EXT: Record<string, Clase> = {
  pdf: 'pdf',
  png: 'imagen', jpg: 'imagen', jpeg: 'imagen', gif: 'imagen', webp: 'imagen', bmp: 'imagen', svg: 'imagen',
  mp4: 'video', webm: 'video', ogv: 'video', mov: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
  txt: 'texto', md: 'texto', json: 'texto', log: 'texto', xml: 'texto', html: 'texto',
  docx: 'docx',
  xlsx: 'hoja', xls: 'hoja', ods: 'hoja', csv: 'hoja',
  pptx: 'pptx',
};

const MIME: Record<string, string> = {
  pdf: 'application/pdf', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', mp4: 'video/mp4', webm: 'video/webm',
  ogv: 'video/ogg', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
};

export function clasePrevia(nombre: string | null | undefined): Clase {
  const n = (nombre ?? '').toLowerCase();
  const ext = n.includes('.') ? n.substring(n.lastIndexOf('.') + 1) : '';
  return EXT[ext] ?? 'ninguna';
}

/**
 * Vista previa de documentos DENTRO del navegador (sin descargar):
 * PDF, imágenes, video/audio, texto, Word (.docx), Excel (.xlsx/.xls/.csv) y PowerPoint (.pptx, en texto).
 * Las librerías de Word/Excel/PowerPoint se cargan solo cuando se necesitan.
 */
@Component({
  selector: 'app-vista-previa',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block w-full' },
  templateUrl: './vista-previa.html',
  styles: [`
    .vp-doc { font-size: 13.5px; line-height: 1.6; color: #241521; }
    .vp-doc h1 { font-size: 22px; font-weight: 700; margin: 0.6em 0 0.3em; }
    .vp-doc h2 { font-size: 18px; font-weight: 700; margin: 0.6em 0 0.3em; }
    .vp-doc h3, .vp-doc h4 { font-size: 15px; font-weight: 700; margin: 0.5em 0 0.25em; }
    .vp-doc p { margin: 0 0 0.6em; }
    .vp-doc ul { list-style: disc; padding-left: 1.5em; margin: 0 0 0.6em; }
    .vp-doc ol { list-style: decimal; padding-left: 1.5em; margin: 0 0 0.6em; }
    .vp-doc table { border-collapse: collapse; margin: 0.5em 0 1em; }
    .vp-doc td, .vp-doc th { border: 1px solid #E3D5C4; padding: 4px 8px; vertical-align: top; }
    .vp-doc img { max-width: 100%; height: auto; }
    .vp-doc a { color: #4A1F52; text-decoration: underline; }
    .vp-hoja table { border-collapse: collapse; font-size: 12.5px; color: #241521; }
    .vp-hoja td, .vp-hoja th { border: 1px solid #E3D5C4; padding: 3px 8px; white-space: nowrap; min-width: 40px; }
    .vp-hoja tr:first-child td { background: #F3EEF6; font-weight: 600; }
  `],
})
export class VistaPrevia {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private archivos = inject(ArchivoService);

  /** Archivo del servidor a mostrar. */
  archivo = input<ArchivoInfo | null | undefined>(null);
  /** Archivo elegido en el equipo y aún NO enviado (base64): se previsualiza antes de subirlo. */
  local = input<ArchivoNuevo | null | undefined>(null);
  /** Botón "Quitar" (solo para archivos locales). */
  quitar = output<void>();
  /** Alto del área de vista previa (clase de Tailwind). */
  alto = input('h-[560px]');
  /** Mostrar la barra con nombre, tamaño y botones. */
  barra = input(true);

  readonly ext = extension;
  readonly tam = tamanioLegible;

  /** Datos para la barra (del servidor o del archivo local). */
  info = computed<{ nombre: string; tamanio: number; local: boolean } | null>(() => {
    const l = this.local();
    if (l) return { nombre: l.nombre, tamanio: bytesDe(l.contenido), local: true };
    const a = this.archivo();
    return a ? { nombre: a.nombre, tamanio: a.tamanio, local: false } : null;
  });
  clase = computed<Clase>(() => clasePrevia(this.info()?.nombre));
  cargando = signal(false);
  error = signal<string | null>(null);
  url = signal<string | null>(null);
  urlSegura = signal<SafeResourceUrl | null>(null);
  texto = signal<string | null>(null);
  html = signal<string | null>(null);
  hojas = signal<{ nombre: string; html: SafeHtml }[]>([]);
  hoja = signal(0);
  diapositivas = signal<Diapositiva[]>([]);

  private urls: string[] = [];
  private pedido = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.limpiar());
    effect(() => {
      const l = this.local();
      const a = this.archivo();
      untracked(() => l ? this.cargarLocal(l) : this.cargar(a ?? null));
    });
  }

  descargar(): void {
    const l = this.local();
    if (l) { guardarBlob(blobDe(l), l.nombre); return; }
    const a = this.archivo();
    if (a) this.archivos.descargar(a);
  }

  /** Vista previa de un archivo del equipo que todavía no se envió. */
  private async cargarLocal(l: ArchivoNuevo): Promise<void> {
    const n = ++this.pedido;
    this.limpiar();
    const clase = clasePrevia(l.nombre);
    if (clase === 'ninguna') return;
    this.cargando.set(true);
    try {
      const info: ArchivoInfo = { id: 0, nombre: l.nombre, tipo: l.tipo, tamanio: bytesDe(l.contenido) };
      await this.mostrar(clase, info, blobDe(l), n);
    } catch (e) {
      if (n === this.pedido) this.error.set('No se pudo mostrar la vista previa de este archivo.');
      console.warn('Vista previa', e);
    } finally {
      if (n === this.pedido) this.cargando.set(false);
    }
  }

  abrirEnPestana(): void {
    const u = this.url();
    if (u) window.open(u, '_blank');
  }

  private async cargar(a: ArchivoInfo | null): Promise<void> {
    const n = ++this.pedido;
    this.limpiar();
    if (!a) return;
    const clase = clasePrevia(a.nombre);
    if (clase === 'ninguna') return;
    this.cargando.set(true);
    try {
      const blob = await firstValueFrom(this.http.get(`${environment.apiUrl}/archivos/${a.id}`, { responseType: 'blob' }));
      if (n !== this.pedido) return;
      await this.mostrar(clase, a, blob, n);
    } catch (e) {
      if (n === this.pedido) this.error.set('No se pudo mostrar la vista previa. Puedes descargar el archivo.');
      console.warn('Vista previa', e);
    } finally {
      if (n === this.pedido) this.cargando.set(false);
    }
  }

  private async mostrar(clase: Clase, a: ArchivoInfo, blob: Blob, n: number): Promise<void> {
    const ext = a.nombre.toLowerCase().split('.').pop() ?? '';
    switch (clase) {
      case 'pdf': case 'imagen': case 'video': case 'audio': {
        const u = this.objeto(new Blob([blob], { type: MIME[ext] ?? a.tipo }));
        this.url.set(u);
        if (clase === 'pdf') this.urlSegura.set(this.sanitizer.bypassSecurityTrustResourceUrl(u));
        return;
      }
      case 'texto': {
        const t = await blob.text();
        this.texto.set(t.length > 200000 ? t.substring(0, 200000) + '\n\n… (vista previa recortada)' : t);
        return;
      }
      case 'docx': {
        const mammoth: any = await import('mammoth/mammoth.browser.min.js');
        const lib = mammoth.default ?? mammoth;
        const r = await lib.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
        if (n !== this.pedido) return;
        // El HTML de mammoth es simple (párrafos, tablas, listas, imágenes); Angular lo sanitiza igual.
        this.html.set(r.value?.trim() ? r.value : '<p><em>El documento no tiene texto.</em></p>');
        return;
      }
      case 'hoja': {
        const XLSX: any = await import('xlsx');
        const lib = XLSX.read ? XLSX : XLSX.default;
        const libro = ext === 'csv'
          ? lib.read(await blob.text(), { type: 'string' })
          : lib.read(await blob.arrayBuffer(), { type: 'array' });
        if (n !== this.pedido) return;
        this.hojas.set(libro.SheetNames.slice(0, 20).map((nombre: string) => ({
          nombre,
          html: this.sanitizer.bypassSecurityTrustHtml(limpiarTabla(lib.utils.sheet_to_html(libro.Sheets[nombre], { header: '', footer: '' }))),
        })));
        this.hoja.set(0);
        return;
      }
      case 'pptx': {
        const JSZip: any = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());
        const slides = Object.keys(zip.files)
          .map(p => ({ p, m: /^ppt\/slides\/slide(\d+)\.xml$/.exec(p) }))
          .filter(x => x.m)
          .sort((x, y) => Number(x.m![1]) - Number(y.m![1]));
        const res: Diapositiva[] = [];
        for (const s of slides) {
          const xml = new DOMParser().parseFromString(await zip.file(s.p).async('string'), 'application/xml');
          const parrafos = Array.from(xml.getElementsByTagName('a:p'))
            .map(p => Array.from(p.getElementsByTagName('a:t')).map(t => t.textContent ?? '').join('').trim())
            .filter(t => t);
          const imagenes: string[] = [];
          const rels = zip.file(`ppt/slides/_rels/slide${s.m![1]}.xml.rels`);
          if (rels) {
            const rx = new DOMParser().parseFromString(await rels.async('string'), 'application/xml');
            for (const r of Array.from(rx.getElementsByTagName('Relationship'))) {
              if (imagenes.length >= 2) break;
              if (!(r.getAttribute('Type') ?? '').endsWith('/image')) continue;
              const ruta = 'ppt/' + (r.getAttribute('Target') ?? '').replace(/^\.\.\//, '');
              const f = zip.file(ruta);
              const e2 = ruta.toLowerCase().split('.').pop() ?? '';
              if (f && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e2)) {
                imagenes.push(this.objeto(new Blob([await f.async('uint8array')], { type: MIME[e2] })));
              }
            }
          }
          res.push({ numero: Number(s.m![1]), titulo: parrafos[0] ?? '', textos: parrafos.slice(1), imagenes });
        }
        if (n !== this.pedido) return;
        this.diapositivas.set(res);
        return;
      }
    }
  }

  private objeto(b: Blob): string {
    const u = URL.createObjectURL(b);
    this.urls.push(u);
    return u;
  }

  private limpiar(): void {
    this.urls.forEach(u => URL.revokeObjectURL(u));
    this.urls = [];
    this.url.set(null);
    this.urlSegura.set(null);
    this.texto.set(null);
    this.html.set(null);
    this.hojas.set([]);
    this.diapositivas.set([]);
    this.error.set(null);
    this.cargando.set(false);
  }
}

/** Convierte el contenido base64 (data URL) en un Blob. */
function blobDe(l: ArchivoNuevo): Blob {
  const c = l.contenido ?? '';
  const coma = c.indexOf(',');
  const b64 = c.startsWith('data:') && coma > 0 ? c.substring(coma + 1) : c;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: l.tipo || 'application/octet-stream' });
}

/** Tamaño aproximado en bytes de un data URL base64. */
function bytesDe(contenido: string | null | undefined): number {
  const c = contenido ?? '';
  const coma = c.indexOf(',');
  const b64 = c.startsWith('data:') && coma > 0 ? c.substring(coma + 1) : c;
  return Math.floor(b64.length * 3 / 4);
}

/** Deja solo la tabla de SheetJS (sin scripts ni estilos) por seguridad. */
function limpiarTabla(html: string): string {
  const d = new DOMParser().parseFromString(html, 'text/html');
  d.querySelectorAll('script, style, link, iframe, object').forEach(e => e.remove());
  d.querySelectorAll('*').forEach(e => Array.from(e.attributes).forEach(at => {
    if (at.name.startsWith('on') || at.name === 'style' || at.name === 'href') e.removeAttribute(at.name);
  }));
  const t = d.querySelector('table');
  return t ? t.outerHTML : '<p>La hoja está vacía.</p>';
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ReporteService } from '../../../core/services/reporte.service';
import { OpcionesReporte, ParametrosReporte, TablaReporte, TipoReporte } from '../../../core/models/reporte.model';
import { guardarBlob } from '../../../core/services/archivo.service';
import { ToastService } from '../../../core/services/toast.service';
import { descargarPdf, nombreArchivo } from '../../../core/utils/pdf-reporte';

type Pestana = 'notas' | 'alumno' | 'asistencia';

interface Filtros {
  grado: string | null;
  seccionId: number | null;
  estudianteId: number | null;
  periodoId: number | null;
  cursoId: number | null;
}

const VACIO: Filtros = { grado: null, seccionId: null, estudianteId: null, periodoId: null, cursoId: null };

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-reportes',
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  private servicio = inject(ReporteService);
  private toast = inject(ToastService);

  readonly porPagina = 25;

  pestana = signal<Pestana>('notas');
  opciones = signal<OpcionesReporte | null>(null);
  cargandoOpciones = signal(true);
  errorOpciones = signal<string | null>(null);

  filtros = signal<Record<Pestana, Filtros>>({ notas: { ...VACIO }, alumno: { ...VACIO }, asistencia: { ...VACIO } });
  tablas = signal<Record<Pestana, TablaReporte | null>>({ notas: null, alumno: null, asistencia: null });
  pagina = signal(1);
  private claves = signal<Partial<Record<Pestana, string>>>({});

  procesando = signal(false);
  descargando = signal<'excel' | 'pdf' | null>(null);
  error = signal<string | null>(null);

  f = computed(() => this.filtros()[this.pestana()]);
  tabla = computed(() => this.tablas()[this.pestana()]);
  desactualizado = computed(() => !!this.tabla() && this.claves()[this.pestana()] !== JSON.stringify(this.parametros()));

  secciones = computed(() => {
    const o = this.opciones(), g = this.f().grado;
    return (o?.secciones ?? []).filter(s => !g || s.grado === g);
  });
  alumnos = computed(() => {
    const o = this.opciones(), f = this.f();
    return (o?.alumnos ?? [])
      .filter(a => (!f.grado || a.grado === f.grado) && (!f.seccionId || a.seccionId === f.seccionId))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil((this.tabla()?.filas.length ?? 0) / this.porPagina)));
  filasPagina = computed(() => {
    const t = this.tabla();
    if (!t) return [];
    const i = (this.pagina() - 1) * this.porPagina;
    return t.filas.slice(i, i + this.porPagina);
  });
  indicadores = computed(() => (this.tabla()?.indicadores ?? []).filter(i => i.etiqueta !== 'Filas mostradas'));
  limite = computed(() => (this.tabla()?.indicadores ?? []).find(i => i.etiqueta === 'Filas mostradas') ?? null);

  ngOnInit(): void {
    this.cargarOpciones();
  }

  cargarOpciones(): void {
    this.cargandoOpciones.set(true);
    this.errorOpciones.set(null);
    this.servicio.opciones().subscribe({
      next: (o) => {
        this.opciones.set(o);
        this.filtros.update(x => ({ ...x, notas: { ...x.notas, periodoId: o.periodoActivo ?? o.periodos[0]?.id ?? null } }));
        this.cargandoOpciones.set(false);
      },
      error: (e) => {
        this.cargandoOpciones.set(false);
        this.errorOpciones.set(e?.error?.mensaje ?? 'No se pudieron cargar los filtros. Revisa que el servidor esté encendido.');
      },
    });
  }

  elegir(p: Pestana): void {
    this.pestana.set(p);
    this.pagina.set(1);
    this.error.set(null);
  }

  cambiar(campo: keyof Filtros, valor: string | number | null): void {
    const p = this.pestana();
    this.filtros.update(x => {
      const f: Filtros = { ...x[p], [campo]: valor === '' ? null : valor } as Filtros;
      if (campo === 'grado') { f.seccionId = null; f.estudianteId = null; }
      if (campo === 'seccionId') {
        f.estudianteId = null;
        const s = this.opciones()?.secciones.find(z => z.id === f.seccionId);
        if (s) f.grado = s.grado;
      }
      if (campo === 'estudianteId' && f.estudianteId) {
        const a = this.opciones()?.alumnos.find(z => z.id === f.estudianteId);
        if (a) { f.grado = a.grado; f.seccionId = a.seccionId; }
      }
      return { ...x, [p]: f };
    });
    this.error.set(null);
  }

  private tipo(p: Pestana = this.pestana()): TipoReporte {
    return p === 'notas' ? 'notas' : p === 'alumno' ? 'notas-alumno' : 'asistencia-alumno';
  }

  private parametros(p: Pestana = this.pestana()): ParametrosReporte {
    const f = this.filtros()[p];
    return p === 'notas'
      ? { grado: f.grado, seccionId: f.seccionId, periodoId: f.periodoId }
      : { grado: f.grado, seccionId: f.seccionId, estudianteId: f.estudianteId, periodoId: f.periodoId, cursoId: f.cursoId };
  }

  private notasCompletas(): boolean {
    return true;
  }

  procesar(): void {
    const p = this.pestana();
    this.procesando.set(true);
    this.error.set(null);
    this.servicio.generar(this.tipo(p), this.parametros(p)).subscribe({
      next: (t) => {
        this.guardarTabla(p, t);
        this.procesando.set(false);
        if (!t.filas.length) this.toast.info('No hay registros con los filtros elegidos.');
      },
      error: (e) => {
        this.procesando.set(false);
        this.error.set(e?.error?.mensaje ?? 'No se pudo generar el reporte. Inténtalo de nuevo.');
      },
    });
  }

  descargarExcel(): void {
    if (this.descargando() || !this.notasCompletas()) return;
    const p = this.pestana();
    this.descargando.set('excel');
    this.error.set(null);
    this.servicio.excel(this.tipo(p), this.parametros(p)).subscribe({
      next: (blob) => {
        this.descargando.set(null);
        guardarBlob(blob, nombreArchivo(this.titulo(p), 'xlsx'));
        this.toast.exito('El archivo Excel se descargó correctamente.');
      },
      error: async (e) => {
        this.descargando.set(null);
        this.error.set(await mensajeBlob(e) ?? 'No se pudo generar el archivo Excel.');
      },
    });
  }

  async descargarPdf(): Promise<void> {
    if (this.descargando() || !this.notasCompletas()) return;
    const p = this.pestana();
    this.descargando.set('pdf');
    this.error.set(null);
    try {
      let t = p === 'notas' ? null : this.tablas()[p];
      if (!t || this.claves()[p] !== JSON.stringify(this.parametros(p))) {
        t = await firstValueFrom(this.servicio.generar(this.tipo(p), this.parametros(p)));
        if (p !== 'notas') this.guardarTabla(p, t);
      }
      const recortado = await descargarPdf(t, this.titulo(p));
      this.toast.exito(recortado ? 'PDF descargado con las primeras 5 000 filas. Usa los filtros o el Excel para ver todo.' : 'El archivo PDF se descargó correctamente.');
    } catch (e: any) {
      this.error.set(e?.error?.mensaje ?? 'No se pudo generar el archivo PDF.');
    } finally {
      this.descargando.set(null);
    }
  }

  private guardarTabla(p: Pestana, t: TablaReporte): void {
    this.tablas.update(x => ({ ...x, [p]: t }));
    this.claves.update(x => ({ ...x, [p]: JSON.stringify(this.parametros(p)) }));
    this.pagina.set(1);
  }

  private titulo(p: Pestana): string {
    const f = this.filtros()[p];
    const s = this.opciones()?.secciones.find(x => x.id === f.seccionId);
    if (p === 'notas') return `Registro de notas ${s?.nombre ?? f.grado ?? 'todos los grados'}`;
    return (p === 'alumno' ? 'Reporte de notas por alumno ' : 'Reporte de asistencia por alumno ') + (s?.nombre ?? f.grado ?? '');
  }

  irPagina(n: number): void {
    this.pagina.set(Math.min(this.totalPaginas(), Math.max(1, n)));
  }

  formato(v: unknown): string {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '');
    return String(v ?? '');
  }

  claseNota(v: unknown): string {
    return typeof v === 'number' && v < 10.5 ? 'text-[#A62639] font-semibold' : 'text-[#241521] font-semibold';
  }

  claseEstado(v: unknown): string {
    switch (v) {
      case 'Asistió': return 'bg-[#E6F4EA] text-[#1E7A3B]';
      case 'Tardanza': return 'bg-[#FDF1DC] text-[#9A6B00]';
      case 'Falta': return 'bg-[#FBE3E6] text-[#A62639]';
      case 'Justificada': return 'bg-[#E3EDFC] text-[#2563EB]';
      default: return 'bg-[#F1ECE4] text-[#6B5A67]';
    }
  }

  puntoEstado(v: unknown): string {
    switch (v) {
      case 'Asistió': return 'bg-[#1E7A3B]';
      case 'Tardanza': return 'bg-[#E0A21B]';
      case 'Falta': return 'bg-[#A62639]';
      case 'Justificada': return 'bg-[#2563EB]';
      default: return 'bg-[#6B5A67]';
    }
  }
}

async function mensajeBlob(e: any): Promise<string | null> {
  try {
    if (e?.error instanceof Blob) return JSON.parse(await e.error.text())?.mensaje ?? null;
    return e?.error?.mensaje ?? null;
  } catch { return null; }
}

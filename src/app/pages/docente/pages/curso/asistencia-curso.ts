import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsistenciaService } from '../../../../core/services/asistencia.service';
import { CursoAula } from '../../../../core/models/aula.model';
import { DiaAsistencia, EstadoAsistencia, SesionAsistencia, SesionesAsistencia } from '../../../../core/models/asistencia.model';
import { Periodo, ROMANOS } from '../../../../core/models/periodo.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { dmy } from '../../../alumno/pages/cursos/curso-detalle';
import { AvatarPersona, horaAmPm } from './curso-ui';
import { ToastService } from '../../../../core/services/toast.service';

interface Grupo { clave: string; nombre: string; sesiones: SesionAsistencia[]; }

const ESTADOS: { id: EstadoAsistencia; nombre: string; color: string; fondo: string; borde: string }[] = [
  { id: 'PRESENTE', nombre: 'Presente', color: '#1E7A3B', fondo: '#E7F3EA', borde: '#1E7A3B' },
  { id: 'TARDANZA', nombre: 'Tardanza', color: '#9A6B00', fondo: '#FDF1DC', borde: '#D99A00' },
  { id: 'FALTA', nombre: 'Faltó', color: '#A62639', fondo: '#FBE7E9', borde: '#A62639' },
  { id: 'JUSTIFICADA', nombre: 'Justificado', color: '#1D4ED8', fondo: '#E6EEFB', borde: '#1D4ED8' },
];

/**
 * Docente > curso > Asistencia.
 * Regla: la asistencia solo se genera durante la hora de clase. Si no se generó queda en rojo;
 * generada y sin registrar = "Sin marcar"; generada y registrada = "Marcado".
 */
@Component({
  selector: 'app-asistencia-curso',
  standalone: true,
  imports: [CommonModule, AvatarPersona],
  templateUrl: './asistencia-curso.html',
})
export class AsistenciaCurso implements OnInit {
  private toast = inject(ToastService);
  private asistencia = inject(AsistenciaService);

  @Input({ required: true }) curso!: CursoAula;
  @Input() periodos: Periodo[] = [];

  readonly dmy = dmy;
  readonly horaAmPm = horaAmPm;
  readonly estados = ESTADOS;

  datos = signal<SesionesAsistencia | null>(null);
  cargando = signal(true);
  generando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  ordenAsc = signal(true);
  cerrados = signal<Set<string>>(new Set());

  // Modal "Tomar asistencia"
  dia = signal<DiaAsistencia | null>(null);
  sesionModal = signal<SesionAsistencia | null>(null);
  soloVer = signal(false);
  marcas = signal<Record<number, EstadoAsistencia | null>>({});
  guardando = signal(false);
  errorModal = signal<string | null>(null);

  salon = computed(() => `${infoGrado(this.curso.grado)?.titulo ?? this.curso.grado} “${this.curso.letra}”`);

  grupos = computed<Grupo[]>(() => {
    const d = this.datos();
    if (!d) return [];
    const asc = this.ordenAsc();
    const ordenar = (l: SesionAsistencia[]) => [...l].sort((a, b) => asc ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha));
    const anio = new Date().getFullYear();
    const pers = this.periodos.filter(p => p.anio === anio).sort((a, b) => a.bimestre - b.bimestre);
    const usados = new Set<string>();
    const grupos: Grupo[] = pers.map(p => {
      const s = d.sesiones.filter(x => x.fecha >= p.fechaInicio && x.fecha <= p.fechaFin);
      s.forEach(x => usados.add(x.fecha));
      return { clave: 'p' + p.id, nombre: `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}`, sesiones: ordenar(s) };
    }).filter(g => g.sesiones.length);
    const otras = d.sesiones.filter(x => !usados.has(x.fecha));
    if (otras.length) grupos.push({ clave: 'otras', nombre: 'Otras fechas', sesiones: ordenar(otras) });
    return grupos;
  });

  marcadosModal = computed(() => Object.values(this.marcas()).filter(v => !!v).length);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.asistencia.sesiones(this.curso.seccionCursoId).subscribe({
      next: (d) => { this.datos.set(d); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo cargar la asistencia.'); },
    });
  }

  generar(): void {
    this.generando.set(true);
    this.error.set(null);
    this.asistencia.generar(this.curso.seccionCursoId).subscribe({
      next: (d) => {
        this.generando.set(false);
        this.datos.set(d);
        this.toast.exito('Asistencia de hoy generada. Ya puedes tomar la asistencia.');
        const hoy = d.sesiones.find(s => s.fecha === d.claseActual?.fecha) ?? d.sesiones.find(s => s.estado === 'SIN_MARCAR');
        if (hoy) this.abrir(hoy, false);
      },
      error: (e) => { this.generando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo generar la asistencia.'); },
    });
  }

  alternar(clave: string): void {
    this.cerrados.update(s => { const n = new Set(s); if (n.has(clave)) n.delete(clave); else n.add(clave); return n; });
  }

  estado(s: SesionAsistencia): { texto: string; color: string; fondo: string } {
    switch (s.estado) {
      case 'MARCADA': return { texto: 'Marcado', color: '#1E7A3B', fondo: '#E7F3EA' };
      case 'SIN_MARCAR': return s.editable ? { texto: 'Sin marcar', color: '#9A6B00', fondo: '#FDF1DC' } : { texto: 'No registrada', color: '#A62639', fondo: '#FBE7E9' };
      case 'HOY': return { texto: 'Hoy (por generar)', color: '#4A1F52', fondo: '#EFEAF3' };
      default: return { texto: 'No generada', color: '#A62639', fondo: '#FBE7E9' };
    }
  }

  // ---------------- Modal ----------------

  abrir(s: SesionAsistencia, soloVer: boolean): void {
    this.sesionModal.set(s);
    this.soloVer.set(soloVer);
    this.dia.set(null);
    this.errorModal.set(null);
    this.asistencia.dia(this.curso.seccionCursoId, s.fecha).subscribe({
      next: (d) => {
        this.dia.set(d);
        const m: Record<number, EstadoAsistencia | null> = {};
        d.alumnos.forEach(a => m[a.estudianteId] = a.estado);
        this.marcas.set(m);
      },
      error: (e) => this.errorModal.set(e?.error?.mensaje ?? 'No se pudo abrir la lista.'),
    });
  }

  cerrarModal(): void { this.sesionModal.set(null); this.dia.set(null); }

  marcar(id: number, e: EstadoAsistencia): void {
    if (this.soloVer()) return;
    this.marcas.update(m => ({ ...m, [id]: e }));
  }

  todosPresentes(): void {
    const d = this.dia();
    if (!d || this.soloVer()) return;
    const m: Record<number, EstadoAsistencia | null> = {};
    d.alumnos.forEach(a => m[a.estudianteId] = this.marcas()[a.estudianteId] ?? 'PRESENTE');
    this.marcas.set(m);
  }

  guardar(): void {
    const d = this.dia(), s = this.sesionModal();
    if (!d || !s) return;
    const faltan = d.alumnos.filter(a => !this.marcas()[a.estudianteId]);
    if (faltan.length) { this.errorModal.set(`Falta marcar a ${faltan.length} alumno${faltan.length === 1 ? '' : 's'}.`); return; }
    this.guardando.set(true);
    this.errorModal.set(null);
    const registros = d.alumnos.map(a => ({ estudianteId: a.estudianteId, estado: this.marcas()[a.estudianteId]!, observacion: a.observacion }));
    this.asistencia.guardar(this.curso.seccionCursoId, s.fecha, registros).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.toast.exito(`Asistencia del ${dmy(s.fecha)} guardada.`);
        this.cargar();
      },
      error: (e) => { this.guardando.set(false); this.errorModal.set(e?.error?.mensaje ?? 'No se pudo guardar la asistencia.'); },
    });
  }

  nombrePeriodo(fecha: string): string {
    const p = this.periodos.find(x => fecha >= x.fechaInicio && fecha <= x.fechaFin);
    return p ? `${ROMANOS[p.bimestre]} Bimestre - ${p.anio}` : 'Asistencia';
  }
}

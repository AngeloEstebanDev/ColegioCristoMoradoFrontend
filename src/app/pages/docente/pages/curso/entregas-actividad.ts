import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AulaService } from '../../../../core/services/aula.service';
import { ArchivoService, extension, tamanioLegible } from '../../../../core/services/archivo.service';
import { Actividad, ArchivoInfo, Entrega, Entregas, Envio, FilaEntrega } from '../../../../core/models/aula.model';
import { VistaPrevia } from '../../../../shared/components/vista-previa/vista-previa';
import { colorNota } from '../../../../core/models/nota.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { num } from '../../../../core/utils/texto';
import { dmy, dmyHora } from '../../../alumno/pages/cursos/curso-detalle';
import { AvatarPersona, ChipVisible, IconoItem, estiloActividad } from './curso-ui';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Docente > curso > Actividades > una actividad: lista de entregas de los alumnos,
 * calificación (nota sobre 20 y comentario), respuesta del alumno y su archivo con vista previa.
 */
@Component({
  selector: 'app-entregas-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule, IconoItem, AvatarPersona, ChipVisible, VistaPrevia],
  templateUrl: './entregas-actividad.html',
})
export class EntregasActividad implements OnChanges {
  private toast = inject(ToastService);
  private aula = inject(AulaService);
  private archivos = inject(ArchivoService);

  @Input({ required: true }) actividad!: Actividad;
  @Output() volver = new EventEmitter<void>();
  @Output() cambio = new EventEmitter<void>();
  @Output() editar = new EventEmitter<void>();
  @Output() alternarVisible = new EventEmitter<void>();
  @Output() eliminar = new EventEmitter<void>();

  readonly dmy = dmy;
  readonly dmyHora = dmyHora;
  readonly num = num;
  readonly tam = tamanioLegible;
  readonly extension = extension;
  readonly colorNota = colorNota;
  readonly letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  datos = signal<Entregas | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  seleccion = signal<number | null>(null);
  guardando = signal(false);
  menu = signal(false);
  nota: number | null = null;
  comentario = '';

  /** Envío elegido en las pestañas "Entrega 1", "Entrega 2"... (null = el último). */
  envioSel = signal<number | null>(null);
  cambiandoTardia = signal(false);

  estilo = computed(() => estiloActividad(this.datos()?.actividad ?? this.actividad));
  enviados = computed(() => (this.datos()?.alumnos ?? []).filter(f => !!f.entrega).length);
  fila = computed<FilaEntrega | null>(() => (this.datos()?.alumnos ?? []).find(f => f.estudianteId === this.seleccion()) ?? null);
  esCuestionario = computed(() => this.actividad.tipo === 'CUESTIONARIO');
  /** Lo que se muestra: el envío elegido del historial o la entrega vigente. */
  vista = computed<Envio | null>(() => {
    const e = this.fila()?.entrega;
    if (!e) return null;
    const envios = e.envios ?? [];
    const sel = this.envioSel();
    const v = envios.find(x => x.numero === sel) ?? envios[envios.length - 1];
    return v ?? actual(e);
  });
  salon = computed(() => `${infoGrado(this.actividad.grado)?.titulo ?? this.actividad.grado} “${this.actividad.letra}”`);

  ngOnChanges(c: SimpleChanges): void {
    if (c['actividad'] && (c['actividad'].firstChange || c['actividad'].previousValue?.id !== this.actividad.id)) this.cargar();
  }

  private cargar(seleccionar: number | null = null): void {
    this.cargando.set(true);
    this.aula.entregas(this.actividad.id).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
        const id = seleccionar ?? d.alumnos.find(f => f.entrega)?.estudianteId ?? d.alumnos[0]?.estudianteId ?? null;
        this.elegir(id);
      },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar las entregas.'); },
    });
  }

  elegir(id: number | null): void {
    this.seleccion.set(id);
    this.exito.set(null);
    this.error.set(null);
    const e = this.fila()?.entrega ?? null;
    this.nota = e?.estado === 'CALIFICADA' && e.nota20 !== null ? round1(e.nota20) : null;
    this.comentario = e?.comentarioDocente ?? '';
    this.envioSel.set(null);
  }

  /** Activa / desactiva "aceptar entregas tardías" desde la misma actividad. */
  alternarTardia(): void {
    const a = this.datos()?.actividad ?? this.actividad;
    this.cambiandoTardia.set(true);
    this.aula.tardiaActividad(a.id, !a.permiteTardia).subscribe({
      next: (act) => {
        this.cambiandoTardia.set(false);
        const d = this.datos();
        if (d) this.datos.set({ ...d, actividad: act });
        this.toast.exito(act.permiteTardia ? 'Entrega tardía activada: los alumnos pueden enviar después de la fecha (quedará marcado "Enviado tarde").' : 'Entrega tardía desactivada.');
        this.cambio.emit();
      },
      error: (er) => { this.cambiandoTardia.set(false); this.error.set(er?.error?.mensaje ?? 'No se pudo cambiar la opción.'); },
    });
  }

  /** Pastilla de nota de cada alumno: nota, "Por calificar" o 0/20 si no envió y ya venció. */
  pastilla(f: FilaEntrega): { texto: string; color: string; fondo: string } {
    const e = f.entrega;
    if (e?.estado === 'CALIFICADA') { const c = colorNota(e.nota20); return { texto: `${num(e.nota20, 1)}/20`, ...c }; }
    if (e) return { texto: 'Por calificar', color: '#1D4ED8', fondo: '#E6EEFB' };
    if (this.actividad.vencida) return { texto: '0/20', color: '#A62639', fondo: '#FBE7E9' };
    return { texto: '—/20', color: '#6B5A67', fondo: '#F0E6D8' };
  }

  guardarNota(): void {
    const e = this.fila()?.entrega;
    if (!e) return;
    if (this.nota === null || this.nota === undefined || isNaN(Number(this.nota)) || this.nota < 0 || this.nota > 20) {
      this.error.set('Escribe una nota entre 0 y 20.');
      return;
    }
    const max = this.datos()?.actividad.puntajeMaximo ?? 20;
    const puntaje = Math.round(Number(this.nota) * max / 20 * 100) / 100;
    this.guardando.set(true);
    this.error.set(null);
    this.aula.calificar(e.id, puntaje, this.comentario.trim() || null).subscribe({
      next: (d) => {
        this.guardando.set(false);
        this.datos.set(d);
        this.toast.exito('Nota guardada. También se actualizó la Participación del alumno.');
        this.cambio.emit();
        // Pasa al siguiente alumno que envió y no tiene nota.
        const sig = d.alumnos.find(f => f.entrega && f.entrega.estado !== 'CALIFICADA');
        if (sig) setTimeout(() => this.elegir(sig.estudianteId), 900);
      },
      error: (er) => { this.guardando.set(false); this.error.set(er?.error?.mensaje ?? 'No se pudo guardar la nota.'); },
    });
  }

  /** Clase de una opción en la respuesta del cuestionario (elegida / correcta). */
  claseOpcion(pi: number, k: number): string {
    const a = this.datos()?.actividad;
    const v = this.vista();
    if (!a || !v) return '';
    const p = a.preguntas[pi];
    const elegidas = v.selecciones?.[pi] ?? [];
    const correctas = p.tipo === 'MULTIPLE' ? (p.respuestasCorrectas ?? []) : [p.respuestaCorrecta];
    const elegida = elegidas.includes(k), correcta = correctas.includes(k);
    if (correcta) return 'border-[#1E7A3B] bg-[#E7F3EA] text-[#1E7A3B]' + (elegida ? ' font-semibold' : '');
    if (elegida) return 'border-[#A62639] bg-[#FBE7E9] text-[#A62639] font-semibold';
    return 'border-[#E3D5C4] bg-white text-[#6B5A67]';
  }

  marcada(pi: number, k: number): boolean {
    return (this.vista()?.selecciones?.[pi] ?? []).includes(k);
  }

  descargar(a: ArchivoInfo): void { this.archivos.descargar(a); }
}

/** La entrega vigente como un "envío" (entregas antiguas sin historial). */
function actual(e: Entrega): Envio {
  const sel = e.selecciones ?? e.respuestas.map(r => [r]);
  return { numero: e.intentos || 1, fecha: e.fechaEntrega, tardia: e.tardia, texto: e.texto, enlace: e.enlace,
           archivo: e.archivo, puntaje: e.puntaje, selecciones: sel };
}

function round1(v: number): number { return Math.round(v * 10) / 10; }

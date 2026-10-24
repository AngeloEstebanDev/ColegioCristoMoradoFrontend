import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AulaService } from '../../../../core/services/aula.service';
import { ArchivoService, tamanioLegible } from '../../../../core/services/archivo.service';
import { Actividad, ArchivoInfo, ArchivoNuevo, FORMATOS_ARCHIVO, FormatoArchivo, Material } from '../../../../core/models/aula.model';
import { EditorTexto } from '../../../../shared/components/editor-texto/editor-texto';
import { VistaPrevia } from '../../../../shared/components/vista-previa/vista-previa';
import { hoyIso } from '../../../../core/utils/texto';
import { ToastService } from '../../../../core/services/toast.service';

export type TipoContenido = 'TEXTO' | 'ARCHIVO' | 'ACTIVIDAD' | 'CUESTIONARIO';

interface PreguntaForm {
  enunciado: string;
  tipo: 'UNICA' | 'MULTIPLE';
  opciones: string[];
  correctas: number[];
  puntos: number;
}

const TIPOS: { id: TipoContenido; titulo: string; texto: string; color: string; fondo: string }[] = [
  { id: 'TEXTO', titulo: 'Crear texto', texto: 'Agrega un mensaje o información en formato de texto para tus estudiantes.', color: '#FFFFFF', fondo: '#2563EB' },
  { id: 'ARCHIVO', titulo: 'Subir archivo', texto: 'Adjunta documentos, presentaciones, imágenes o cualquier otro archivo.', color: '#9333EA', fondo: '#F3E8FD' },
  { id: 'ACTIVIDAD', titulo: 'Crear actividad', texto: 'Asigna una tarea con fecha de entrega y seguimiento de entrega.', color: '#059669', fondo: '#E3F4EC' },
  { id: 'CUESTIONARIO', titulo: 'Crear cuestionario', texto: 'Diseña un cuestionario interactivo con diferentes tipos de preguntas.', color: '#FFFFFF', fondo: '#F97316' },
];

/**
 * Modal "Agregar contenido" (y editar) de una carpeta del curso:
 * texto con formato (+ imagen opcional), archivo, actividad (tarea con fecha, hora e intentos)
 * o cuestionario (opción única / selección múltiple).
 */
@Component({
  selector: 'app-contenido-form',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorTexto, VistaPrevia],
  templateUrl: './contenido-form.html',
})
export class ContenidoForm implements OnInit {
  private toast = inject(ToastService);
  private aula = inject(AulaService);
  private archivos = inject(ArchivoService);

  @Input({ required: true }) cursoId!: number;
  @Input() carpetaId: number | null = null;
  @Input() carpetaNombre = '';
  @Input() material: Material | null = null;
  @Input() actividad: Actividad | null = null;
  @Input() tipoInicial: TipoContenido = 'TEXTO';
  @Output() guardado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  readonly tipos = TIPOS;
  readonly tam = tamanioLegible;
  readonly letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  tipo = signal<TipoContenido>('TEXTO');
  guardando = signal(false);
  error = signal<string | null>(null);
  arrastrando = signal(false);

  titulo = '';
  contenido = '';
  instrucciones = '';
  fecha = '';
  hora = '';
  intentos = 1;
  /** Opción del docente: aceptar envíos después de la fecha límite (marcados como tardíos). */
  permiteTardia = false;
  readonly formatosDisponibles = FORMATOS_ARCHIVO;
  formatos = signal<FormatoArchivo[]>(FORMATOS_ARCHIVO.map(f => f.id));
  archivo = signal<ArchivoNuevo | null>(null);
  archivoActual = signal<ArchivoInfo | null>(null);
  quitarArchivo = false;
  preguntas = signal<PreguntaForm[]>([]);

  editando = computed(() => !!this.material || !!this.actividad);
  info = computed(() => TIPOS.find(t => t.id === this.tipo())!);
  /** El cuestionario ya tiene respuestas: no se puede editar (se avisa antes de abrir). */
  /** Ya no se bloquea: el docente puede editar todo aunque haya entregas (menos el tipo). */
  bloqueada = computed(() => false);
  /** Entregas que ya tiene la actividad (para avisar que las notas se recalculan). */
  conEntregas = computed(() => this.actividad?.entregadas ?? 0);

  /** Fecha mínima del calendario: hoy. */
  get hoy(): string { return hoyIso(); }

  alternarFormato(f: FormatoArchivo): void {
    this.formatos.update(l => l.includes(f) ? l.filter(x => x !== f) : [...l, f]);
    this.error.set(null);
  }

  ngOnInit(): void {
    const m = this.material, a = this.actividad;
    if (m) {
      this.tipo.set(m.tipo === 'ARCHIVO' || (!m.tipo && m.archivo && !m.descripcion) ? 'ARCHIVO' : 'TEXTO');
      this.titulo = m.titulo;
      this.contenido = m.descripcion ?? '';
      this.archivoActual.set(m.archivo);
    } else if (a) {
      this.tipo.set(a.tipo === 'CUESTIONARIO' ? 'CUESTIONARIO' : 'ACTIVIDAD');
      this.titulo = a.titulo;
      this.instrucciones = a.instrucciones ?? '';
      this.fecha = a.fechaLimite.substring(0, 10);
      this.hora = a.fechaLimite.substring(11, 16);
      this.intentos = a.intentosPermitidos ?? 1;
      this.permiteTardia = !!a.permiteTardia;
      if (a.formatosPermitidos?.length) this.formatos.set([...a.formatosPermitidos]);
      this.archivoActual.set(a.archivo);
      this.preguntas.set(a.preguntas.map(p => ({
        enunciado: p.enunciado,
        tipo: p.tipo === 'MULTIPLE' ? 'MULTIPLE' : 'UNICA',
        opciones: [...p.opciones],
        correctas: p.tipo === 'MULTIPLE' ? [...(p.respuestasCorrectas ?? [])] : p.respuestaCorrecta !== null && p.respuestaCorrecta !== undefined ? [p.respuestaCorrecta] : [],
        puntos: p.puntos,
      })));
    } else {
      this.tipo.set(this.tipoInicial);
      this.fecha = hoyIso();   // por defecto, hoy (se calcula cada vez que se abre)
      this.hora = '23:59';
    }
    if (this.tipo() === 'CUESTIONARIO' && !this.preguntas().length) this.agregarPregunta();
  }

  elegirTipo(t: TipoContenido): void {
    if (this.editando()) return;
    this.tipo.set(t);
    this.error.set(null);
    if (t === 'TEXTO' && this.archivo() && !this.archivo()!.tipo.startsWith('image/')) this.archivo.set(null);
    if (t === 'CUESTIONARIO' && !this.preguntas().length) this.agregarPregunta();
  }

  // ---------------- Archivo ----------------

  async elegirArchivo(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (f) await this.leer(f);
  }

  async soltar(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    this.arrastrando.set(false);
    const f = ev.dataTransfer?.files?.[0];
    if (f) await this.leer(f);
  }

  sobre(ev: DragEvent): void {
    ev.preventDefault();
    this.arrastrando.set(true);
  }

  private async leer(f: File): Promise<void> {
    if (this.tipo() === 'TEXTO' && !/^image\/(jpeg|png)$/.test(f.type)) {
      this.error.set('La imagen debe ser JPG o PNG.');
      return;
    }
    try {
      this.archivo.set(await this.archivos.leer(f));
      this.error.set(null);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  quitar(): void {
    if (this.archivo()) { this.archivo.set(null); return; }
    if (this.archivoActual()) { this.archivoActual.set(null); this.quitarArchivo = true; }
  }

  // ---------------- Preguntas ----------------

  agregarPregunta(): void {
    this.preguntas.update(l => [...l, { enunciado: '', tipo: 'UNICA', opciones: ['', ''], correctas: [], puntos: 1 }]);
  }

  quitarPregunta(i: number): void {
    this.preguntas.update(l => l.filter((_, k) => k !== i));
  }

  cambiarTipoPregunta(i: number, tipo: 'UNICA' | 'MULTIPLE'): void {
    this.preguntas.update(l => l.map((p, k) => k !== i ? p : { ...p, tipo, correctas: tipo === 'UNICA' ? p.correctas.slice(0, 1) : p.correctas }));
  }

  agregarOpcion(i: number): void {
    this.preguntas.update(l => l.map((p, k) => k !== i || p.opciones.length >= 8 ? p : { ...p, opciones: [...p.opciones, ''] }));
  }

  quitarOpcion(i: number, o: number): void {
    this.preguntas.update(l => l.map((p, k) => {
      if (k !== i || p.opciones.length <= 2) return p;
      return {
        ...p,
        opciones: p.opciones.filter((_, j) => j !== o),
        correctas: p.correctas.filter(c => c !== o).map(c => c > o ? c - 1 : c),
      };
    }));
  }

  marcar(i: number, o: number): void {
    this.preguntas.update(l => l.map((p, k) => {
      if (k !== i) return p;
      if (p.tipo === 'UNICA') return { ...p, correctas: [o] };
      return { ...p, correctas: p.correctas.includes(o) ? p.correctas.filter(c => c !== o) : [...p.correctas, o].sort() };
    }));
  }

  esCorrecta(p: PreguntaForm, o: number): boolean { return p.correctas.includes(o); }

  // El [(ngModel)] dentro de @for necesita trackBy por índice; se edita en el mismo objeto.
  trackIndice(i: number): number { return i; }

  // ---------------- Guardar ----------------

  guardar(): void {
    this.error.set(null);
    if (!this.titulo.trim()) { this.error.set('Escribe un título.'); return; }
    const t = this.tipo();
    if (t === 'TEXTO' || t === 'ARCHIVO') this.guardarMaterial(t);
    else this.guardarActividad(t);
  }

  private guardarMaterial(t: 'TEXTO' | 'ARCHIVO'): void {
    if (t === 'TEXTO' && !this.contenido.trim()) { this.error.set('Escribe el contenido del texto.'); return; }
    if (t === 'ARCHIVO' && !this.archivo() && !this.archivoActual()) { this.error.set('Selecciona el archivo que vas a subir.'); return; }
    const datos = {
      titulo: this.titulo.trim(),
      descripcion: t === 'TEXTO' ? this.contenido : null,
      enlace: null,
      archivo: this.archivo(),
      quitarArchivo: this.quitarArchivo,
      tipo: t,
      carpetaId: this.material ? this.material.carpetaId : this.carpetaId,
    };
    this.guardando.set(true);
    const op = this.material ? this.aula.actualizarMaterial(this.material.id, datos) : this.aula.crearMaterial(this.cursoId, datos);
    op.subscribe({
      next: () => { this.guardando.set(false); this.toast.exito(this.editando() ? 'Cambios guardados.' : 'Contenido publicado.'); this.guardado.emit(); },
      error: (e) => { this.guardando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo guardar.'); },
    });
  }

  private guardarActividad(t: 'ACTIVIDAD' | 'CUESTIONARIO'): void {
    if (!this.fecha) { this.error.set('Indica la fecha de entrega.'); return; }
    if (!this.hora) { this.error.set('Indica la hora máxima.'); return; }
    const limite = `${this.fecha}T${this.hora}`;
    if (!this.actividad && new Date(limite).getTime() <= Date.now()) {
      this.error.set('La fecha y hora de entrega deben ser posteriores a este momento.');
      return;
    }
    if (t === 'ACTIVIDAD' && !this.formatos().length) { this.error.set('Elige al menos un formato de archivo para la entrega.'); return; }
    const preguntas = t === 'CUESTIONARIO' ? this.preguntas() : [];
    if (t === 'CUESTIONARIO') {
      if (!preguntas.length) { this.error.set('Agrega al menos una pregunta.'); return; }
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        const n = `Pregunta ${i + 1}: `;
        if (!p.enunciado.trim()) { this.error.set(n + 'escribe el enunciado.'); return; }
        if (p.opciones.filter(o => o.trim()).length < 2 || p.opciones.some(o => !o.trim())) { this.error.set(n + 'completa todas las opciones (mínimo 2).'); return; }
        if (!p.correctas.length) { this.error.set(n + (p.tipo === 'UNICA' ? 'marca la respuesta correcta.' : 'marca al menos una respuesta correcta.')); return; }
        if (!(p.puntos > 0 && p.puntos <= 20)) { this.error.set(n + 'los puntos van de 0.5 a 20.'); return; }
      }
    }
    const datos = {
      tipo: t === 'CUESTIONARIO' ? 'CUESTIONARIO' as const : 'TAREA' as const,
      titulo: this.titulo.trim(),
      instrucciones: this.instrucciones.trim() || null,
      fechaLimite: limite,
      puntajeMaximo: 20,
      permiteTardia: this.permiteTardia,
      formatosPermitidos: t === 'CUESTIONARIO' ? null : this.formatos(),
      enlace: null,
      archivo: t === 'CUESTIONARIO' ? null : this.archivo(),
      quitarArchivo: this.quitarArchivo,
      intentosPermitidos: this.intentos,
      carpetaId: this.actividad ? this.actividad.carpetaId : this.carpetaId,
      preguntas: preguntas.map(p => ({
        enunciado: p.enunciado.trim(),
        opciones: p.opciones.map(o => o.trim()),
        respuestaCorrecta: p.tipo === 'UNICA' ? p.correctas[0] : null,
        respuestasCorrectas: p.correctas,
        tipo: p.tipo,
        puntos: Number(p.puntos),
      })),
    };
    this.guardando.set(true);
    const op = this.actividad ? this.aula.actualizarActividad(this.actividad.id, datos) : this.aula.crearActividad(this.cursoId, datos);
    op.subscribe({
      next: () => { this.guardando.set(false); this.toast.exito(this.editando() ? 'Cambios guardados.' : 'Contenido publicado.'); this.guardado.emit(); },
      error: (e) => { this.guardando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo guardar.'); },
    });
  }

  textoBoton(): string {
    switch (this.tipo()) {
      case 'TEXTO': return 'Guardar texto';
      case 'ARCHIVO': return 'Guardar archivo';
      case 'ACTIVIDAD': return 'Guardar actividad';
      default: return 'Guardar cuestionario';
    }
  }
}

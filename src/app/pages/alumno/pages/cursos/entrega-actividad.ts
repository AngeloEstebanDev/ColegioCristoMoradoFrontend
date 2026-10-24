import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AulaService } from '../../../../core/services/aula.service';
import { ArchivoService, extension, tamanioLegible } from '../../../../core/services/archivo.service';
import { Actividad, ArchivoNuevo, CursoAula, Envio, FORMATOS_ARCHIVO, extensionesDe, infoTipo } from '../../../../core/models/aula.model';
import { VistaPrevia } from '../../../../shared/components/vista-previa/vista-previa';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { colorNota } from '../../../../core/models/nota.model';
import { num, plazo } from '../../../../core/utils/texto';
import { dmyHora } from './curso-detalle';

import { Val, revisar } from '../../../../core/utils/validadores';
/**
 * Alumno > Mis Cursos > curso > entregar una tarea o resolver un cuestionario.
 * Regla: se envía ANTES de la fecha de vencimiento; después solo si el docente activó "entrega tardía"
 * (el envío queda marcado como "enviado tarde"). Cada envío queda en el historial: Entrega 1, Entrega 2...
 * Al enviar, vuelve solo al curso (pestaña Actividades) con un aviso.
 * Cada actividad tiene un número de intentos (lo fija el docente). Las tareas se pueden modificar mientras
 * queden intentos, estén en plazo y sin calificar; en el cuestionario se guarda el mejor intento.
 * Las preguntas pueden ser de opción única o de selección múltiple.
 */
@Component({
  selector: 'app-alumno-entrega-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VistaPrevia],
  templateUrl: './entrega-actividad.html',
})
export class AlumnoEntregaActividad implements OnInit {

  private aula = inject(AulaService);
  private archivos = inject(ArchivoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmar = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);

  readonly num = num;
  readonly plazo = plazo;
  readonly dmyHora = dmyHora;
  readonly tam = tamanioLegible;
  readonly extension = extension;
  readonly letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  cursoId = 0;
  curso = signal<CursoAula | null>(null);
  actividad = signal<Actividad | null>(null);
  cargando = signal(true);
  enviando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  editando = signal(false);
  arrastrando = signal(false);
  verInstrucciones = signal(true);
  verAdjuntos = signal(true);
  verEntrega = signal(true);
  /** Se actualiza cada 30 s para que el plazo se cierre solo al vencer. */
  ahora = signal(Date.now());

  texto = '';
  enlace = '';
  archivo = signal<ArchivoNuevo | null>(null);
  /** Opciones marcadas en cada pregunta. */
  respuestas = signal<number[][]>([]);

  tipo = computed(() => infoTipo(this.actividad()?.tipo));
  esCuestionario = computed(() => this.actividad()?.tipo === 'CUESTIONARIO');
  entrega = computed(() => this.actividad()?.miEntrega ?? null);
  vencida = computed(() => {
    const a = this.actividad();
    return !!a && new Date(a.fechaLimite).getTime() <= this.ahora();
  });
  intentosUsados = computed(() => this.actividad()?.miEntrega ? (this.actividad()!.miEntrega!.intentos ?? 1) : 0);
  intentosPermitidos = computed(() => this.actividad()?.intentosPermitidos ?? 1);
  quedan = computed(() => Math.max(0, this.intentosPermitidos() - this.intentosUsados()));
  /** Venció, pero el docente acepta entregas tardías. */
  tarde = computed(() => this.vencida() && !!this.actividad()?.permiteTardia);
  /** ¿Puede enviar? En plazo (o con entrega tardía), con intentos disponibles y (si es tarea) sin calificar. */
  abierta = computed(() => {
    const a = this.actividad();
    if (!a || (this.vencida() && !a.permiteTardia)) return false;
    if (!this.esCuestionario() && a.miEntrega?.estado === 'CALIFICADA') return false;
    return this.quedan() > 0;
  });
  /** Historial "Entrega 1", "Entrega 2"... y el envío elegido (por defecto el último). */
  envios = computed<Envio[]>(() => this.entrega()?.envios ?? []);
  envioSel = signal<number | null>(null);
  envio = computed<Envio | null>(() => {
    const l = this.envios();
    return l.find(x => x.numero === this.envioSel()) ?? l[l.length - 1] ?? null;
  });
  /** Formatos que pidió el docente (ej. "PDF, Word") y el filtro del selector de archivos. */
  formatosTexto = computed(() => {
    const f = this.actividad()?.formatosPermitidos ?? [];
    return FORMATOS_ARCHIVO.filter(x => !f.length || f.includes(x.id)).map(x => x.nombre).join(', ');
  });
  aceptar = computed(() => extensionesDe(this.actividad()?.formatosPermitidos).map(e => '.' + e).join(','));
  mostrarFormulario = computed(() => this.abierta() && (!this.entrega() || this.editando()));
  respondidas = computed(() => this.respuestas().filter(r => r.length > 0).length);
  colorNota = computed(() => colorNota(this.entrega()?.estado === 'CALIFICADA' ? this.entrega()!.nota20 : null));

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('id'));
    const actividadId = Number(this.route.snapshot.paramMap.get('actividadId'));
    this.aula.curso(this.cursoId).subscribe({ next: (c) => this.curso.set(c), error: () => {} });
    this.aula.actividad(actividadId).subscribe({
      next: (a) => {
        this.actividad.set(a);
        this.texto = a.miEntrega?.texto ?? '';
        this.enlace = a.miEntrega?.enlace ?? '';
        this.respuestas.set(a.preguntas.map(() => []));
        this.cargando.set(false);
      },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo abrir la actividad.'); },
    });
    const t = setInterval(() => this.ahora.set(Date.now()), 30_000);
    this.destroyRef.onDestroy(() => clearInterval(t));
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
    const ext = f.name.includes('.') ? f.name.substring(f.name.lastIndexOf('.') + 1).toLowerCase() : '';
    if (!extensionesDe(this.actividad()?.formatosPermitidos).includes(ext)) {
      this.error.set(`Formato no permitido${ext ? ' (.' + ext + ')' : ''}. Tu docente acepta: ${this.formatosTexto()}.`);
      return;
    }
    try {
      this.archivo.set(await this.archivos.leer(f));
      this.error.set(null);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  descargarAdjunto(): void {
    const a = this.actividad()?.archivo;
    if (a) this.archivos.descargar(a);
  }

  // ---------------- Cuestionario ----------------

  multiple(i: number): boolean { return this.actividad()?.preguntas[i]?.tipo === 'MULTIPLE'; }

  responder(i: number, opcion: number): void {
    if (!this.mostrarFormulario()) return;
    const multiple = this.multiple(i);
    this.respuestas.update(r => r.map((v, k) => {
      if (k !== i) return v;
      if (!multiple) return [opcion];
      return v.includes(opcion) ? v.filter(x => x !== opcion) : [...v, opcion].sort();
    }));
  }

  /** Opciones elegidas: las del formulario o, si ya envió, las del intento elegido en el historial. */
  elegidas(i: number): number[] {
    if (this.mostrarFormulario()) return this.respuestas()[i] ?? [];
    const e = this.entrega();
    if (!e) return this.respuestas()[i] ?? [];
    const v = this.envio();
    if (v?.selecciones) return v.selecciones[i] ?? [];
    return e.selecciones?.[i] ?? (e.respuestas[i] !== undefined ? [e.respuestas[i]] : []);
  }

  claseOpcion(i: number, k: number): string {
    const a = this.actividad();
    if (!a) return '';
    const elegida = this.elegidas(i).includes(k);
    const p = a.preguntas[i];
    const correctas = p?.tipo === 'MULTIPLE' ? (p.respuestasCorrectas ?? null)
      : p?.respuestaCorrecta !== null && p?.respuestaCorrecta !== undefined ? [p.respuestaCorrecta] : null;
    if (!this.mostrarFormulario() && this.entrega() && correctas) {
      if (correctas.includes(k)) return 'border-[#1E7A3B] bg-[#E7F3EA] text-[#1E7A3B]';
      if (elegida) return 'border-[#A62639] bg-[#FBE7E9] text-[#A62639]';
      return 'border-[#E3D5C4] bg-white text-[#6B5A67]';
    }
    return elegida ? 'border-[#4A1F52] bg-[#EFEAF3] text-[#4A1F52]' : 'border-[#E3D5C4] bg-white text-[#241521] hover:bg-[#FAF6EF]';
  }

  /** Cuestionario: empezar otro intento (si quedan). */
  nuevoIntento(): void {
    const a = this.actividad();
    if (!a) return;
    this.respuestas.set(a.preguntas.map(() => []));
    this.exito.set(null);
    this.editando.set(true);
  }

  // ---------------- Enviar ----------------

  /** Siempre pide confirmación antes de enviar (con el detalle de intentos y si es tardía). */
  async enviar(): Promise<void> {
    const a = this.actividad();
    if (!a) return;
    this.error.set(null);
    this.ahora.set(Date.now());
    if (!this.abierta()) { this.error.set('La fecha de entrega ya venció; ya no puedes enviar.'); return; }
    if (this.esCuestionario() && this.respuestas().some(r => !r.length)) {
      this.error.set('Responde todas las preguntas antes de enviar.');
      return;
    }
    if (!this.esCuestionario() && !this.texto.trim() && !this.enlace.trim() && !this.archivo() && !this.entrega()?.archivo) {
      this.error.set('Escribe tu respuesta, pega un enlace o adjunta un archivo.');
      return;
    }
    const errEnlace = revisar(this.enlace, Val.enlace());
    if (!this.esCuestionario() && errEnlace) { this.error.set(errEnlace); return; }
    const restantes = this.quedan() - 1;
    const numero = this.intentosUsados() + 1;
    const partes: string[] = [];
    if (this.esCuestionario()) {
      partes.push(`Vas a enviar tus respuestas de "${a.titulo}" (intento ${numero} de ${this.intentosPermitidos()}).`);
      partes.push(restantes > 0 ? `Te quedará${restantes === 1 ? '' : 'n'} ${restantes} intento${restantes === 1 ? '' : 's'}; se guarda tu mejor nota.` : 'Es tu último intento.');
    } else {
      partes.push(`Vas a enviar la Entrega ${numero} de "${a.titulo}"${this.archivo() ? ' con el archivo ' + this.archivo()!.nombre : ''}.`);
      if (restantes === 0) partes.push('Es tu último intento: después ya no podrás enviar otra entrega.');
    }
    if (this.tarde()) partes.push('La fecha límite ya pasó: tu entrega quedará marcada como "enviada tarde".');
    const ok = await this.confirmar.pedir(partes.join('\n'), {
      titulo: this.esCuestionario() ? '¿Enviar tus respuestas?' : '¿Enviar tu entrega?',
      aceptar: this.esCuestionario() ? 'Sí, enviar respuestas' : 'Sí, enviar',
      peligro: false,
    });
    if (!ok) return;
    this.enviando.set(true);
    this.aula.entregar(a.id, {
      texto: this.esCuestionario() ? null : this.texto.trim() || null,
      enlace: this.esCuestionario() ? null : this.enlace.trim() || null,
      archivo: this.esCuestionario() ? null : this.archivo(),
      respuestas: null,
      selecciones: this.esCuestionario() ? this.respuestas() : null,
    }).subscribe({
      next: (d) => {
        this.enviando.set(false);
        this.actividad.set(d);
        this.archivo.set(null);
        this.editando.set(false);
        const tardia = !!d.miEntrega?.tardia;
        const n = d.miEntrega?.envios?.length ?? d.miEntrega?.intentos ?? 1;
        let texto = this.esCuestionario()
          ? `¡Cuestionario "${d.titulo}" enviado! Tu mejor puntaje: ${num(d.miEntrega?.puntaje ?? 0)} de ${num(d.puntajeMaximo)} puntos.`
          : `¡Entrega ${n} de "${d.titulo}" enviada! Tu docente la revisará pronto.`;
        if (tardia) texto = `Enviaste tarde: "${d.titulo}" se entregó después de la fecha límite (${dmyHora(d.fechaLimite)}). Tu docente verá tu entrega marcada como tardía.`;
        // Vuelve automáticamente al curso (pestaña Actividades) con el aviso.
        this.router.navigate(['/home', 'alumno', 'cursos', this.cursoId], {
          queryParams: { tab: 'actividades' },
          state: { avisoEntrega: { texto, tardia } },
        });
      },
      error: (e) => { this.enviando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo enviar la entrega.'); },
    });
  }
}

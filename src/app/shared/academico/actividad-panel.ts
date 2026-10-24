import { Component, HostListener, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AulaService } from '../../core/services/aula.service';
import { ArchivoService, tamanioLegible } from '../../core/services/archivo.service';
import { Actividad, ArchivoNuevo, SITUACIONES, infoTipo } from '../../core/models/aula.model';
import { fechaHora, num, plazo } from '../../core/utils/texto';
import { VistaPrevia } from '../components/vista-previa/vista-previa';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';

import { Val, revisar } from '../../core/utils/validadores';
/**
 * Panel lateral de una actividad (HU-15).
 * - Alumno (puedeEntregar): ve las instrucciones y entrega (texto/enlace/archivo o responde el cuestionario).
 * - Padre: solo consulta la actividad y la entrega de su hijo.
 */
@Component({
  selector: 'app-actividad-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, VistaPrevia],
  templateUrl: './actividad-panel.html',
})
export class ActividadPanel implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);
  private aula = inject(AulaService);
  private archivos = inject(ArchivoService);

  /** Actividad de la lista (se recarga el detalle si puedeEntregar). */
  actividad = input.required<Actividad>();
  puedeEntregar = input(false);
  cerrar = output<void>();
  entregada = output<Actividad>();

  readonly infoTipo = infoTipo;
  readonly situaciones = SITUACIONES;
  readonly fechaHora = fechaHora;
  readonly plazo = plazo;
  readonly num = num;
  readonly tam = tamanioLegible;
  readonly letras = ['A', 'B', 'C', 'D', 'E', 'F'];

  detalle = signal<Actividad | null>(null);
  cargando = signal(false);
  enviando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  editando = signal(false);

  texto = '';
  enlace = '';
  archivo = signal<ArchivoNuevo | null>(null);
  respuestas = signal<(number | null)[]>([]);

  a = computed(() => this.detalle() ?? this.actividad());
  entrega = computed(() => this.a().miEntrega);
  esCuestionario = computed(() => this.a().tipo === 'CUESTIONARIO');
  /** Puede enviar (o reenviar) mientras no esté calificada y esté en plazo (o se acepten tardías). */
  abierta = computed(() => {
    const a = this.a();
    if (!this.puedeEntregar()) return false;
    if (a.miEntrega?.estado === 'CALIFICADA') return false;
    if (this.esCuestionario() && a.miEntrega) return false;
    return !a.vencida || a.permiteTardia;
  });
  mostrarFormulario = computed(() => this.abierta() && (!this.entrega() || this.editando()));
  respondidas = computed(() => this.respuestas().filter(r => r !== null).length);

  ngOnInit(): void {
    if (this.puedeEntregar()) {
      this.cargando.set(true);
      this.aula.actividad(this.actividad().id).subscribe({
        next: (d) => { this.detalle.set(d); this.prepararFormulario(d); this.cargando.set(false); },
        error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo abrir la actividad.'); },
      });
    }
  }

  private prepararFormulario(d: Actividad): void {
    this.texto = d.miEntrega?.texto ?? '';
    this.enlace = d.miEntrega?.enlace ?? '';
    this.respuestas.set(d.preguntas.map(() => null));
  }

  async elegirArchivo(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    try {
      this.archivo.set(await this.archivos.leer(f));
      this.error.set(null);
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  responder(i: number, opcion: number): void {
    this.respuestas.update(r => r.map((v, k) => k === i ? opcion : v));
  }

  async enviar(): Promise<void> {
    const a = this.a();
    this.error.set(null);
    if (this.esCuestionario()) {
      if (this.respuestas().some(r => r === null)) { this.error.set('Responde todas las preguntas antes de enviar.'); return; }
      if (!await this.confirmar.pedir('¿Enviar tus respuestas? El cuestionario solo se puede enviar una vez.')) return;
    } else if (!this.texto.trim() && !this.enlace.trim() && !this.archivo() && !this.entrega()?.archivo) {
      this.error.set('Escribe tu respuesta, pega un enlace o adjunta un archivo.');
      return;
    } else if (revisar(this.enlace, Val.enlace())) {
      this.error.set(revisar(this.enlace, Val.enlace()));
      return;
    } else if (!await this.confirmar.pedir(`¿Enviar tu entrega de "${a.titulo}"?` + (a.vencida ? '\nLa fecha límite ya pasó: quedará marcada como enviada tarde.' : ''),
      { titulo: '¿Enviar tu entrega?', aceptar: 'Sí, enviar', peligro: false })) {
      return;
    }
    this.enviando.set(true);
    this.aula.entregar(a.id, {
      texto: this.esCuestionario() ? null : this.texto.trim() || null,
      enlace: this.esCuestionario() ? null : this.enlace.trim() || null,
      archivo: this.esCuestionario() ? null : this.archivo(),
      respuestas: this.esCuestionario() ? this.respuestas() as number[] : null,
    }).subscribe({
      next: (d) => {
        this.enviando.set(false);
        this.detalle.set(d);
        this.archivo.set(null);
        this.editando.set(false);
        this.toast.exito(this.esCuestionario()
          ? `¡Cuestionario enviado! Obtuviste ${num(d.miEntrega?.puntaje ?? 0)} de ${num(d.puntajeMaximo)} puntos.`
          : '¡Entrega enviada! Tu docente la revisará pronto.');
        this.entregada.emit(d);
      },
      error: (e) => { this.enviando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo enviar la entrega.'); },
    });
  }

  claseOpcion(i: number, k: number): string {
    const a = this.a();
    const elegida = this.entrega() ? this.entrega()!.respuestas[i] === k : this.respuestas()[i] === k;
    const correcta = a.preguntas[i]?.respuestaCorrecta;
    if (this.entrega() && correcta !== null && correcta !== undefined) {
      if (k === correcta) return 'border-[#1E7A3B] bg-[#E7F3EA] text-[#1E7A3B]';
      if (elegida) return 'border-[#A62639] bg-[#FBE7E9] text-[#A62639]';
      return 'border-[#E3D5C4] bg-white text-[#6B5A67]';
    }
    return elegida ? 'border-[#4A1F52] bg-[#EFEAF3] text-[#4A1F52]' : 'border-[#E3D5C4] bg-white text-[#241521] hover:bg-[#FAF6EF]';
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    this.cerrar.emit();
  }
}

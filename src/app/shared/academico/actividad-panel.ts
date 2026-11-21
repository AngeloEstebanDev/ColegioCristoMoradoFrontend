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
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);
  /** Servicio AulaService (inyectado por Angular). */
  private aula = inject(AulaService);
  /** Servicio ArchivoService (inyectado por Angular). */
  private archivos = inject(ArchivoService);

  /** Actividad de la lista (se recarga el detalle si puedeEntregar). */
  actividad = input.required<Actividad>();
  /** Dato de entrada «puede entregar» que envía el componente padre. */
  puedeEntregar = input(false);
  /** Evento «cerrar» que este componente avisa al componente padre. */
  cerrar = output<void>();
  /** Evento «entregada» que este componente avisa al componente padre. */
  entregada = output<Actividad>();

  readonly infoTipo = infoTipo;
  readonly situaciones = SITUACIONES;
  readonly fechaHora = fechaHora;
  readonly plazo = plazo;
  readonly num = num;
  readonly tam = tamanioLegible;
  readonly letras = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** Estado (signal): detalle. */
  detalle = signal<Actividad | null>(null);
  /** Estado (signal): cargando. */
  cargando = signal(false);
  /** Estado (signal): enviando. */
  enviando = signal(false);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): éxito. */
  exito = signal<string | null>(null);
  /** Estado (signal): editando. */
  editando = signal(false);

  texto = '';
  enlace = '';
  /** Estado (signal): archivo. */
  archivo = signal<ArchivoNuevo | null>(null);
  /** Estado (signal): respuestas. */
  respuestas = signal<(number | null)[]>([]);

  /** Valor calculado (computed): a. Se actualiza solo. */
  a = computed(() => this.detalle() ?? this.actividad());
  /** Valor calculado (computed): entrega. Se actualiza solo. */
  entrega = computed(() => this.a().miEntrega);
  /** Valor calculado (computed): es cuestionario. Se actualiza solo. */
  esCuestionario = computed(() => this.a().tipo === 'CUESTIONARIO');
  /** Puede enviar (o reenviar) mientras no esté calificada y esté en plazo (o se acepten tardías). */
  abierta = computed(() => {
    const a = this.a();
    if (!this.puedeEntregar()) return false;
    if (a.miEntrega?.estado === 'CALIFICADA') return false;
    if (this.esCuestionario() && a.miEntrega) return false;
    return !a.vencida || a.permiteTardia;
  });
  /** Valor calculado (computed): mostrar formulario. Se actualiza solo. */
  mostrarFormulario = computed(() => this.abierta() && (!this.entrega() || this.editando()));
  /** Valor calculado (computed): respondidas. Se actualiza solo. */
  respondidas = computed(() => this.respuestas().filter(r => r !== null).length);

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void {
    if (this.puedeEntregar()) {
      this.cargando.set(true);
      this.aula.actividad(this.actividad().id).subscribe({
        next: (d) => { this.detalle.set(d); this.prepararFormulario(d); this.cargando.set(false); },
        error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo abrir la actividad.'); },
      });
    }
  }

  /** Prepara formulario. */
  private prepararFormulario(d: Actividad): void {
    this.texto = d.miEntrega?.texto ?? '';
    this.enlace = d.miEntrega?.enlace ?? '';
    this.respuestas.set(d.preguntas.map(() => null));
  }

  /** Elige archivo. */
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

  /** Responde los datos de esta pantalla. */
  responder(i: number, opcion: number): void {
    this.respuestas.update(r => r.map((v, k) => k === i ? opcion : v));
  }

  /**
   * Envía los datos de esta pantalla. Muestra un aviso (toast) con el resultado. Antes pide
   * confirmación al usuario.
   */
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

  /** Devuelve las clases CSS de opción. */
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

  /** Se ejecuta al presionar la tecla Esc: cierra la ventana o el menú que esté abierto. */
  @HostListener('document:keydown.escape')
  escape(): void {
    this.cerrar.emit();
  }
}

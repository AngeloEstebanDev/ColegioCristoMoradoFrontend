import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SeccionService } from '../../../../core/services/seccion.service';
import { GRADOS_ACADEMICOS, GradoInfo, Seccion, TURNOS, TurnoNombre, horarioDe, horarioTurno, recreoDe, seccionesDelGrado, turnoDe } from '../../../../core/models/seccion.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Académico > Grados y Secciones.
 * Fila de grados (1° Primaria a 5° Secundaria) y las secciones del grado elegido.
 */
@Component({
  selector: 'app-grados-secciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './grados-secciones.html',
})
export class GradosSecciones implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private seccionService = inject(SeccionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly grados = GRADOS_ACADEMICOS;
  readonly horarioDe = horarioDe;
  readonly turnoDe = turnoDe;
  readonly recreoDe = recreoDe;
  readonly turnos = TURNOS;
  /** Valor del combo para crear una sección adicional. */
  readonly OTRO = 'OTRO';
  private carrusel = viewChild<ElementRef<HTMLElement>>('carrusel');

  secciones = signal<Seccion[]>([]);
  gradoSel = signal<GradoInfo>(GRADOS_ACADEMICOS[0]);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  // Panel "Nueva sección"
  panelAbierto = signal(false);
  /** Letra de una sección predefinida o 'OTRO'. */
  letra = signal<string | null>(null);
  /** Sección adicional ("Otros"): su letra y su turno. */
  letraOtra = signal('');
  turnoOtro = signal<TurnoNombre>('Mañana');
  capacidad = signal(35);
  guardando = signal(false);
  errorPanel = signal<string | null>(null);

  seccionesDelGrado = computed(() => this.secciones()
    .filter(s => s.grado === this.gradoSel().valor)
    .sort((a, b) => a.letra.localeCompare(b.letra)));

  /** Secciones permitidas (según horarios fijos) que el grado elegido todavía no tiene. */
  seccionesLibres = computed(() => {
    const usadas = new Set(this.seccionesDelGrado().map(s => s.letra));
    return seccionesDelGrado(this.gradoSel().valor).filter(t => !usadas.has(t.letra));
  });

  /** Letras que ya usa el grado elegido. */
  private letrasUsadas = computed(() => new Set(this.seccionesDelGrado().map(s => s.letra.toUpperCase())));

  /** Primera letra libre para una sección adicional (después de las predefinidas). */
  siguienteLetra = computed(() => {
    const predef = new Set(seccionesDelGrado(this.gradoSel().valor).map(t => t.letra));
    for (let c = 65; c <= 90; c++) {
      const l = String.fromCharCode(c);
      if (!this.letrasUsadas().has(l) && !predef.has(l)) return l;
    }
    return '';
  });

  /** Horario que tendrá la sección adicional con el turno elegido. */
  horarioOtro = computed(() => horarioTurno(this.gradoSel().valor, this.turnoOtro()));

  ngOnInit(): void {
    const g = this.grados.find(x => x.valor === this.route.snapshot.queryParamMap.get('grado'));
    if (g) this.gradoSel.set(g);
    this.cargar();
    // Lleva a la vista el grado elegido al volver del detalle
    setTimeout(() => this.centrarGrado(), 0);
  }

  cargar(): void {
    this.cargando.set(true);
    this.seccionService.listar().subscribe({
      next: (s) => { this.secciones.set(s); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  elegirGrado(g: GradoInfo): void {
    this.gradoSel.set(g);
    this.router.navigate([], { relativeTo: this.route, queryParams: { grado: g.valor }, replaceUrl: true });
  }

  desplazar(dir: number): void {
    this.carrusel()?.nativeElement.scrollBy({ left: dir * 320, behavior: 'smooth' });
  }

  private centrarGrado(): void {
    const el = this.carrusel()?.nativeElement.querySelector<HTMLElement>('[data-activo="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  abrirSeccion(s: Seccion): void {
    this.router.navigate(['/home/admin/academico/grados-secciones', s.id]);
  }

  async alternarEstado(s: Seccion, ev: Event): Promise<void> {
    ev.stopPropagation();
    const activar = s.estado === 'Inactiva';
    if (!activar && !await this.confirmar.pedir(`¿Desactivar la sección ${s.letra} de ${s.grado}? No se podrán matricular alumnos en ella.`)) return;
    this.seccionService.cambiarEstado(s.id, activar).subscribe({
      next: (act) => this.secciones.update(l => l.map(x => x.id === act.id ? act : x)),
      error: (err) => this.error.set(err?.error?.mensaje ?? 'No se pudo cambiar el estado de la sección.'),
    });
  }

  // ---------------- Nueva sección ----------------

  abrirNueva(): void {
    this.letra.set(this.seccionesLibres()[0]?.letra ?? this.OTRO);
    this.letraOtra.set(this.siguienteLetra());
    this.turnoOtro.set('Mañana');
    this.capacidad.set(35);
    this.errorPanel.set(null);
    this.panelAbierto.set(true);
  }

  escribirLetraOtra(v: string): void {
    this.letraOtra.set((v ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase());
    this.errorPanel.set(null);
  }

  guardar(): void {
    const opcion = this.letra();
    if (!opcion) { this.errorPanel.set('Selecciona la sección.'); return; }
    const otra = opcion === this.OTRO;
    const letra = otra ? this.letraOtra().trim().toUpperCase() : opcion;
    if (otra) {
      if (!/^[A-Z]$/.test(letra)) { this.errorPanel.set('Escribe la letra de la sección (A a Z).'); return; }
      if (this.letrasUsadas().has(letra)) { this.errorPanel.set(`${this.gradoSel().valor} ya tiene la sección ${letra}.`); return; }
      if (seccionesDelGrado(this.gradoSel().valor).some(t => t.letra === letra)) {
        this.errorPanel.set(`La sección ${letra} es predefinida: elígela en la lista.`); return;
      }
    }
    const cap = Number(this.capacidad());
    if (!cap || !Number.isInteger(cap) || cap < 1 || cap > 60) { this.errorPanel.set('La capacidad debe estar entre 1 y 60.'); return; }
    this.guardando.set(true);
    this.errorPanel.set(null);
    this.seccionService.crear({
      grado: this.gradoSel().valor, letra, turno: otra ? this.turnoOtro() : '', capacidad: cap,
    }).subscribe({
      next: (s) => {
        this.guardando.set(false);
        this.panelAbierto.set(false);
        this.toast.exito(`Se creó la sección ${s.letra} de ${s.grado}.`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(err?.error?.mensaje ?? 'No se pudo crear la sección.');
      },
    });
  }
}

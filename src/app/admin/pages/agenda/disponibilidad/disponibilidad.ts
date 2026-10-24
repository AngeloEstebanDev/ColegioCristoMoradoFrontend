import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgendaService } from '../../../../core/services/agenda.service';
import { Disponibilidad as Bloque } from '../../../../core/models/cita.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

const PASO = 15;

/**
 * Mi Agenda > Disponibilidad (docentes, administración y directiva).
 * Grilla semanal (lunes a viernes) en bloques de 15 minutos: verde = disponible.
 * Se pinta con clic o arrastrando. "Guardar cambios" reemplaza la disponibilidad de toda la semana;
 * los padres ven estos horarios para solicitar citas y el docente agenda sus convocatorias dentro de ellos.
 */
@Component({
  imports: [CommonModule],
  selector: 'app-disponibilidad',
  templateUrl: './disponibilidad.html',
})
export class Disponibilidad implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);
  private agenda = inject(AgendaService);

  readonly dias = [
    { numero: 1, nombre: 'Lunes' }, { numero: 2, nombre: 'Martes' }, { numero: 3, nombre: 'Miércoles' },
    { numero: 4, nombre: 'Jueves' }, { numero: 5, nombre: 'Viernes' },
  ];

  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  inicio = signal(7 * 60);
  fin = signal(19 * 60);
  /** Celdas marcadas: "dia-minuto". */
  marcadas = signal<Set<string>>(new Set());
  private original = new Set<string>();
  /** Bloques del sábado (no se muestran en la grilla; se conservan al guardar). */
  private sabado: Bloque[] = [];

  private pintando: boolean | null = null;

  filas = computed(() => {
    const l: number[] = [];
    for (let t = this.inicio(); t < this.fin(); t += PASO) l.push(t);
    return l;
  });
  cambios = computed(() => {
    const m = this.marcadas();
    return m.size !== this.original.size || [...m].some(k => !this.original.has(k));
  });
  horasSemana = computed(() => this.marcadas().size * PASO / 60);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.agenda.disponibilidad().subscribe({
      next: (b) => { this.aplicar(b); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo cargar tu disponibilidad.'); },
    });
  }

  private aplicar(bloques: Bloque[]): void {
    const activos = bloques.filter(b => b.activo);
    this.sabado = activos.filter(b => b.dia === 6);
    const semana = activos.filter(b => b.dia >= 1 && b.dia <= 5);
    let ini = 7 * 60, fin = 19 * 60;
    semana.forEach(b => {
      ini = Math.min(ini, Math.floor(min(b.horaInicio) / PASO) * PASO);
      fin = Math.max(fin, Math.ceil(min(b.horaFin) / PASO) * PASO);
    });
    this.inicio.set(ini);
    this.fin.set(fin);
    const s = new Set<string>();
    semana.forEach(b => {
      for (let t = Math.floor(min(b.horaInicio) / PASO) * PASO; t < min(b.horaFin); t += PASO) s.add(`${b.dia}-${t}`);
    });
    this.original = new Set(s);
    this.marcadas.set(s);
  }

  marcada(dia: number, t: number): boolean { return this.marcadas().has(`${dia}-${t}`); }

  hora(t: number): string { return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }

  // ---------------- Pintar ----------------

  presionar(dia: number, t: number, ev: MouseEvent): void {
    ev.preventDefault();
    this.pintando = !this.marcada(dia, t);
    this.poner(dia, t);
  }

  pasar(dia: number, t: number): void {
    if (this.pintando !== null) this.poner(dia, t);
  }

  @HostListener('document:mouseup')
  soltar(): void { this.pintando = null; }

  private poner(dia: number, t: number): void {
    const k = `${dia}-${t}`;
    this.marcadas.update(s => {
      if (s.has(k) === this.pintando) return s;
      const n = new Set(s);
      if (this.pintando) n.add(k); else n.delete(k);
      return n;
    });
  }

  /** Marca o desmarca un día completo al hacer clic en su encabezado. */
  alternarDia(dia: number): void {
    const todas = this.filas().every(t => this.marcada(dia, t));
    this.marcadas.update(s => {
      const n = new Set(s);
      this.filas().forEach(t => { const k = `${dia}-${t}`; if (todas) n.delete(k); else n.add(k); });
      return n;
    });
  }

  async vaciar(): Promise<void> {
    if (this.marcadas().size && !await this.confirmar.pedir('¿Vaciar toda la disponibilidad de la semana? (Se aplica al guardar.)')) return;
    this.marcadas.set(new Set());
  }

  descartar(): void {
    this.marcadas.set(new Set(this.original));
    this.aviso.set(null);
  }

  guardar(): void {
    const bloques: { dia: number; horaInicio: string; horaFin: string }[] = [];
    for (const d of this.dias) {
      let desde: number | null = null;
      const filas = this.filas();
      for (let i = 0; i <= filas.length; i++) {
        const t = filas[i];
        const on = i < filas.length && this.marcada(d.numero, t);
        if (on && desde === null) desde = t;
        if (!on && desde !== null) {
          bloques.push({ dia: d.numero, horaInicio: this.hora(desde), horaFin: this.hora(filas[i - 1] + PASO) });
          desde = null;
        }
      }
    }
    this.sabado.forEach(b => bloques.push({ dia: 6, horaInicio: b.horaInicio, horaFin: b.horaFin }));
    this.guardando.set(true);
    this.error.set(null);
    this.agenda.guardarSemana(bloques).subscribe({
      next: (b) => {
        this.guardando.set(false);
        this.aplicar(b);
        this.toast.exito('Disponibilidad guardada. Los padres ya pueden solicitar citas en estos horarios.');
      },
      error: (e) => { this.guardando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo guardar la disponibilidad.'); },
    });
  }
}

function min(h: string): number {
  const [a, b] = h.split(':').map(Number);
  return a * 60 + b;
}

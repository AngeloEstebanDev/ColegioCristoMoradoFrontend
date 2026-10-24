import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoService } from '../../../../core/services/periodo.service';
import { hoyIso } from '../../../../core/utils/texto';
import { BIMESTRES, Periodo, ROMANOS } from '../../../../core/models/periodo.model';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Académico > Periodos: bimestres del año escolar. El activo es el que contiene la fecha de hoy. */
@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './periodos.html',
})
export class Periodos implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private periodoService = inject(PeriodoService);

  readonly bimestres = BIMESTRES;
  readonly romanos = ROMANOS;
  /** Fecha de hoy (local, se actualiza cada día). */
  private get hoy(): string { return hoyIso(); }

  periodos = signal<Periodo[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  // Panel "Nuevo periodo" / "Editar periodo"
  panelAbierto = signal(false);
  /** Periodo que se está editando (null = se crea uno nuevo). */
  editando = signal<Periodo | null>(null);
  nombre = signal('');
  nombreTocado = signal(false);
  anio = signal(new Date().getFullYear());
  bimestre = signal<number | null>(null);
  inicio = signal('');
  fin = signal('');
  listaBimestres = signal(false);
  guardando = signal(false);
  errorPanel = signal<string | null>(null);

  /** Bimestres ya registrados en el año elegido en el formulario. */
  usados = computed(() => new Set(this.periodos()
    .filter(p => p.anio === Number(this.anio()) && p.id !== this.editando()?.id).map(p => p.bimestre)));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.periodoService.listar().subscribe({
      next: (p) => { this.periodos.set(p); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  // ---------------- Presentación ----------------

  info(b: number) {
    return BIMESTRES[b - 1] ?? BIMESTRES[0];
  }

  /** "24 may 2026" */
  fechaCorta(f: string): string {
    const [a, m, d] = f.split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${MESES[m - 1]} ${a}`;
  }

  /** "24/05/2026" */
  fechaNum(f: string): string {
    const [a, m, d] = f.split('-');
    return `${d}/${m}/${a}`;
  }

  /** % del periodo transcurrido hoy. */
  avance(p: Periodo): number {
    const ini = new Date(p.fechaInicio).getTime(), fin = new Date(p.fechaFin).getTime(), hoy = new Date(this.hoy).getTime();
    if (hoy <= ini) return 0;
    if (hoy >= fin) return 100;
    return Math.round((hoy - ini) / (fin - ini) * 100);
  }

  situacion(p: Periodo): string {
    if (this.hoy < p.fechaInicio) return 'Por iniciar';
    if (this.hoy > p.fechaFin) return 'Finalizado';
    return 'En progreso';
  }

  // ---------------- Nuevo periodo ----------------

  abrirNuevo(): void {
    this.editando.set(null);
    this.anio.set(new Date().getFullYear());
    const libre = BIMESTRES.find(b => !this.usados().has(b.numero));
    this.bimestre.set(libre?.numero ?? null);
    this.nombre.set('');
    this.nombreTocado.set(false);
    this.sugerirNombre();
    this.inicio.set(this.hoy);   // por defecto, la fecha de hoy
    this.fin.set('');
    this.errorPanel.set(null);
    this.listaBimestres.set(false);
    this.panelAbierto.set(true);
  }

  // ---------------- Editar periodo ----------------

  abrirEditar(p: Periodo): void {
    this.editando.set(p);
    this.anio.set(p.anio);
    this.bimestre.set(p.bimestre);
    this.nombre.set(p.nombre);
    // Si el nombre es el sugerido ("III Bimestre 2026"), se sigue actualizando al cambiar año o bimestre.
    this.nombreTocado.set(p.nombre !== `${ROMANOS[p.bimestre]} Bimestre ${p.anio}`);
    this.inicio.set(p.fechaInicio);
    this.fin.set(p.fechaFin);
    this.errorPanel.set(null);
    this.listaBimestres.set(false);
    this.panelAbierto.set(true);
  }

  /** Mientras el usuario no escriba su propio nombre, se propone "II Bimestre 2026". */
  private sugerirNombre(): void {
    const b = this.bimestre();
    if (!this.nombreTocado()) this.nombre.set(b ? `${ROMANOS[b]} Bimestre ${this.anio()}` : '');
  }

  escribirNombre(v: string): void {
    this.nombre.set(v);
    this.nombreTocado.set(!!v.trim());
  }

  cambiarAnio(v: number): void {
    this.anio.set(v);
    this.sugerirNombre();
    this.errorPanel.set(null);
  }

  alternarBimestres(ev: Event): void {
    ev.stopPropagation();
    this.listaBimestres.set(!this.listaBimestres());
  }

  elegirBimestre(n: number, ev: Event): void {
    ev.stopPropagation();
    if (this.usados().has(n)) return;
    this.bimestre.set(n);
    this.listaBimestres.set(false);
    this.sugerirNombre();
    this.errorPanel.set(null);
  }

  guardar(): void {
    const anio = Number(this.anio()), b = this.bimestre();
    if (!anio || anio < 2000 || anio > 2100) { this.errorPanel.set('Ingresa un año válido.'); return; }
    if (!b) { this.errorPanel.set('Selecciona el bimestre.'); return; }
    if (this.usados().has(b)) { this.errorPanel.set(`El ${ROMANOS[b]} Bimestre de ${anio} ya está registrado.`); return; }
    if (!this.inicio() || !this.fin()) { this.errorPanel.set('Indica la fecha de inicio y de fin.'); return; }
    if (this.fin() <= this.inicio()) { this.errorPanel.set('La fecha fin debe ser posterior a la fecha de inicio.'); return; }
    const ini = this.inicio(), fin = this.fin();
    if (Number(ini.slice(0, 4)) !== anio || Number(fin.slice(0, 4)) !== anio) {
      this.errorPanel.set(`Las fechas deben estar dentro del año ${anio}.`); return;
    }
    const cruce = this.periodos().find(p => p.id !== this.editando()?.id && !(ini > p.fechaFin) && !(fin < p.fechaInicio));
    if (cruce) {
      this.errorPanel.set(`Las fechas se cruzan con ${cruce.nombre} (${this.fechaNum(cruce.fechaInicio)} al ${this.fechaNum(cruce.fechaFin)}).`);
      return;
    }
    const datos = { nombre: this.nombre().trim(), anio, bimestre: b, fechaInicio: ini, fechaFin: fin };
    const edit = this.editando();
    this.guardando.set(true);
    this.errorPanel.set(null);
    (edit ? this.periodoService.actualizar(edit.id, datos) : this.periodoService.crear(datos)).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.panelAbierto.set(false);
        this.editando.set(null);
        this.toast.exito(edit ? `Se guardaron los cambios de ${p.nombre}.` : `Se creó ${p.nombre}. Pulsa "Activar" cuando empiece.`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(err?.error?.mensaje ?? (edit ? 'No se pudo guardar el periodo.' : 'No se pudo crear el periodo.'));
      },
    });
  }

  @HostListener('document:click')
  cerrarLista(): void {
    this.listaBimestres.set(false);
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.listaBimestres()) { this.listaBimestres.set(false); return; }
    this.panelAbierto.set(false);
  }
}

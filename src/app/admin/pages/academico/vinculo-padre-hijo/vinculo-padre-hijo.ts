import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { VinculoService } from '../../../../core/services/vinculo.service';
import { EstudianteService } from '../../../../core/services/estudiante.service';
import { PadreService } from '../../../../core/services/padre.service';
import { Vinculo } from '../../../../core/models/vinculo.model';
import { Estudiante, GRADOS } from '../../../../core/models/estudiante.model';
import { PARENTESCOS, PadreFamilia } from '../../../../core/models/padre.model';
import { infoDocumento } from '../../../../core/models/documento.model';
import { iniciales } from '../../../../core/utils/texto';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

/** Tipo Campo: describe la forma de los datos de «campo». */
type Campo = 'alumno' | 'padre';

/**
 * Académico > Vínculo Padre-Hijo.
 * ÚNICO lugar donde se relacionan padres/apoderados con sus hijos
 * (en Usuarios > Padres solo se ven, no se vinculan).
 */
@Component({
  selector: 'app-vinculo-padre-hijo',
  standalone: true,
  imports: [FotoUsuario, CommonModule, FormsModule],
  templateUrl: './vinculo-padre-hijo.html',
})
export class VinculoPadreHijo implements OnInit {
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);

  /** Servicio VinculoService (inyectado por Angular). */
  private vinculoService = inject(VinculoService);
  /** Servicio EstudianteService (inyectado por Angular). */
  private estudianteService = inject(EstudianteService);
  /** Servicio PadreService (inyectado por Angular). */
  private padreService = inject(PadreService);

  readonly parentescos = PARENTESCOS;
  readonly grados = GRADOS;
  readonly iniciales = iniciales;

  /** Estado (signal): vinculos. */
  vinculos = signal<Vinculo[]>([]);
  /** Estado (signal): alumnos. */
  alumnos = signal<Estudiante[]>([]);
  /** Estado (signal): padres. */
  padres = signal<PadreFamilia[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): aviso. */
  aviso = signal<string | null>(null);

  // Filtros y paginación
  busqueda = signal('');
  /** Estado (signal): filtro grado. */
  filtroGrado = signal('');
  /** Estado (signal): filtro parentesco. */
  filtroParentesco = signal('');
  /** Estado (signal): página. */
  pagina = signal(1);
  readonly porPagina = 10;

  // Panel lateral (nuevo / editar parentesco)
  panelAbierto = signal(false);
  /** Estado (signal): editando. */
  editando = signal<Vinculo | null>(null);
  /** Estado (signal): alumno sel. */
  alumnoSel = signal<Estudiante | null>(null);
  /** Estado (signal): padre sel. */
  padreSel = signal<PadreFamilia | null>(null);
  /** Estado (signal): parentesco. */
  parentesco = signal('Apoderado');
  /** Estado (signal): guardando. */
  guardando = signal(false);
  /** Estado (signal): error panel. */
  errorPanel = signal<string | null>(null);

  // Comboboxes con búsqueda
  abierto = signal<Campo | null>(null);
  /** Estado (signal): texto alumno. */
  textoAlumno = signal('');
  /** Estado (signal): texto padre. */
  textoPadre = signal('');
  /** Estado (signal): resaltado. */
  resaltado = signal(-1);

  // ---------------- Derivados ----------------

  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    return this.vinculos().filter(v =>
      (!t || v.estudianteNombre.toLowerCase().includes(t) || v.padreNombre.toLowerCase().includes(t)
          || v.estudianteDocumento.toLowerCase().includes(t) || v.padreDocumento.toLowerCase().includes(t))
      && (!this.filtroGrado() || v.grado === this.filtroGrado())
      && (!this.filtroParentesco() || v.parentesco === this.filtroParentesco()));
  });

  /** Valor calculado (computed): total páginas. Se actualiza solo. */
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina)));
  /** Valor calculado (computed): página datos. Se actualiza solo. */
  paginaDatos = computed(() => {
    const ini = (this.pagina() - 1) * this.porPagina;
    return this.filtrados().slice(ini, ini + this.porPagina);
  });

  /** Valor calculado (computed): alumnos sin apoderado. Se actualiza solo. */
  alumnosSinApoderado = computed(() => {
    const con = new Set(this.vinculos().map(v => v.estudianteId));
    return this.alumnos().filter(a => !con.has(a.id)).length;
  });
  /** Valor calculado (computed): padres sin hijos. Se actualiza solo. */
  padresSinHijos = computed(() => {
    const con = new Set(this.vinculos().map(v => v.padreId));
    return this.padres().filter(p => !con.has(p.id)).length;
  });

  /** Valor calculado (computed): opciones alumno. Se actualiza solo. */
  opcionesAlumno = computed(() => {
    const t = this.textoAlumno().toLowerCase().trim();
    return this.alumnos()
      .filter(a => !t || a.nombreCompleto.toLowerCase().includes(t) || a.dni.toLowerCase().includes(t))
      .slice(0, 30);
  });
  /** Valor calculado (computed): opciones padre. Se actualiza solo. */
  opcionesPadre = computed(() => {
    const t = this.textoPadre().toLowerCase().trim();
    return this.padres()
      .filter(p => !t || p.nombreCompleto.toLowerCase().includes(t) || p.dni.toLowerCase().includes(t))
      .slice(0, 30);
  });

  /** Vínculos que ya tiene el alumno elegido (para mostrarlos en el panel). */
  vinculosDelAlumno = computed(() => {
    const a = this.alumnoSel();
    return a ? this.vinculos().filter(v => v.estudianteId === a.id && v.id !== this.editando()?.id) : [];
  });

  /** Aviso previo si el parentesco elegido ya está ocupado (Padre/Madre) o el vínculo ya existe. */
  advertencia = computed(() => {
    const a = this.alumnoSel(), p = this.padreSel(), par = this.parentesco();
    if (!a) return null;
    const otros = this.vinculosDelAlumno();
    if (p && !this.editando() && otros.some(v => v.padreId === p.id)) return `${p.nombreCompleto} ya está vinculado con este alumno.`;
    if ((par === 'Padre' || par === 'Madre') && otros.some(v => v.parentesco === par)) {
      return `${a.nombreCompleto} ya tiene registrado(a) a su ${par.toLowerCase()}.`;
    }
    return null;
  });

  // ---------------- Carga ----------------

  ngOnInit(): void {
    this.cargar();
  }

  /** Carga los datos de esta pantalla. */
  cargar(): void {
    this.cargando.set(true);
    forkJoin({
      vinculos: this.vinculoService.listar(),
      alumnos: this.estudianteService.listar(),
      padres: this.padreService.listar(),
    }).subscribe({
      next: ({ vinculos, alumnos, padres }) => {
        this.vinculos.set(vinculos);
        this.alumnos.set([...alumnos].sort((x, y) => x.nombreCompleto.localeCompare(y.nombreCompleto)));
        this.padres.set([...padres].sort((x, y) => x.nombreCompleto.localeCompare(y.nombreCompleto)));
        this.cargando.set(false);
      },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  /** Devuelve la etiqueta de doc. */
  etiquetaDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).corto;
  }

  /** Devuelve las clases CSS de parentesco. */
  claseParentesco(p: string): string {
    switch (p) {
      case 'Padre': return 'bg-[#E6EEF8] text-[#1F4E8C]';
      case 'Madre': return 'bg-[#F8E6EF] text-[#8C1F55]';
      case 'Apoderado': return 'bg-[#EFEAF3] text-[#4A1F52]';
      default: return 'bg-[#F0E6D8] text-[#6B5A67]';
    }
  }

  /** Navega a página. */
  irAPagina(n: number): void {
    if (n >= 1 && n <= this.totalPaginas()) this.pagina.set(n);
  }

  // ---------------- Panel ----------------

  abrirNuevo(): void {
    this.editando.set(null);
    this.alumnoSel.set(null);
    this.padreSel.set(null);
    this.textoAlumno.set('');
    this.textoPadre.set('');
    this.parentesco.set('Apoderado');
    this.errorPanel.set(null);
    this.abierto.set(null);
    this.panelAbierto.set(true);
  }

  /** Abre editar. */
  abrirEditar(v: Vinculo): void {
    this.editando.set(v);
    this.alumnoSel.set(this.alumnos().find(a => a.id === v.estudianteId) ?? null);
    this.padreSel.set(this.padres().find(p => p.id === v.padreId) ?? null);
    this.parentesco.set(v.parentesco);
    this.errorPanel.set(null);
    this.abierto.set(null);
    this.panelAbierto.set(true);
  }

  /** Cierra panel. */
  cerrarPanel(): void {
    this.abierto.set(null);
    this.panelAbierto.set(false);
  }

  /** Guarda los datos de esta pantalla. Muestra un aviso (toast) con el resultado. */
  guardar(): void {
    const ed = this.editando();
    const a = this.alumnoSel(), p = this.padreSel();
    if (!ed && !a) { this.errorPanel.set('Selecciona al alumno.'); return; }
    if (!ed && !p) { this.errorPanel.set('Selecciona al padre o apoderado.'); return; }
    this.guardando.set(true);
    this.errorPanel.set(null);
    const peticion = ed
      ? this.vinculoService.cambiarParentesco(ed.id, this.parentesco())
      : this.vinculoService.crear({ estudianteId: a!.id, padreId: p!.id, parentesco: this.parentesco() });
    peticion.subscribe({
      next: (v) => {
        this.guardando.set(false);
        this.cerrarPanel();
        this.toast.exito(ed
          ? `Parentesco actualizado: ${v.padreNombre} es ${v.parentesco.toLowerCase()} de ${v.estudianteNombre}.`
          : `Se vinculó a ${v.padreNombre} (${v.parentesco}) con ${v.estudianteNombre}.`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(err?.error?.mensaje ?? 'No se pudo guardar el vínculo.');
      },
    });
  }

  /**
   * Quita el vínculo de los datos de esta pantalla. Pide los datos al backend con
   * vinculoService.eliminar() y actualiza la pantalla cuando llega la respuesta. Muestra un aviso
   * (toast) con el resultado. Antes pide confirmación al usuario.
   */
  async desvincular(v: Vinculo): Promise<void> {
    if (!await this.confirmar.pedir(`¿Quitar el vínculo entre ${v.padreNombre} y ${v.estudianteNombre}? Ninguna cuenta se elimina.`)) return;
    this.vinculoService.eliminar(v.id).subscribe({
      next: () => {
        this.toast.exito(`Se quitó el vínculo entre ${v.padreNombre} y ${v.estudianteNombre}.`);
        this.cargar();
      },
      error: (err) => this.error.set(err?.error?.mensaje ?? 'No se pudo quitar el vínculo.'),
    });
  }

  // ---------------- Comboboxes ----------------

  escribir(campo: Campo, texto: string): void {
    if (campo === 'alumno') { this.textoAlumno.set(texto); this.alumnoSel.set(null); }
    else { this.textoPadre.set(texto); this.padreSel.set(null); }
    this.abierto.set(campo);
    this.resaltado.set(-1);
  }

  /** Abre lista. */
  abrirLista(campo: Campo): void {
    this.abierto.set(campo);
    this.resaltado.set(-1);
  }

  /** Muestra u oculta lista. */
  alternarLista(campo: Campo, input: HTMLInputElement | null): void {
    if (this.abierto() === campo) { this.abierto.set(null); return; }
    input?.focus();
    this.abrirLista(campo);
  }

  /** Elige alumno. */
  elegirAlumno(a: Estudiante): void {
    this.alumnoSel.set(a);
    this.textoAlumno.set(a.nombreCompleto);
    this.abierto.set(null);
  }

  /** Elige padre. */
  elegirPadre(p: PadreFamilia): void {
    this.padreSel.set(p);
    this.textoPadre.set(p.nombreCompleto);
    this.abierto.set(null);
  }

  /** Flechas, Enter y Escape dentro de los comboboxes. */
  tecla(campo: Campo, ev: KeyboardEvent): void {
    const lista = campo === 'alumno' ? this.opcionesAlumno() : this.opcionesPadre();
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.abierto.set(campo);
      if (!lista.length) return;
      const paso = ev.key === 'ArrowDown' ? 1 : -1;
      this.resaltado.set((this.resaltado() + paso + lista.length) % lista.length);
    } else if (ev.key === 'Enter') {
      const i = this.resaltado();
      if (this.abierto() === campo && i >= 0 && i < lista.length) {
        ev.preventDefault();
        if (campo === 'alumno') this.elegirAlumno(lista[i] as Estudiante);
        else this.elegirPadre(lista[i] as PadreFamilia);
      }
    } else if (ev.key === 'Escape' && this.abierto()) {
      ev.stopPropagation();
      this.abierto.set(null);
    } else if (ev.key === 'Tab') {
      this.abierto.set(null);
    }
  }

  /** Se ejecuta al presionar la tecla Esc: cierra la ventana o el menú que esté abierto. */
  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.abierto()) { this.abierto.set(null); return; }
    if (this.panelAbierto()) this.cerrarPanel();
  }
}

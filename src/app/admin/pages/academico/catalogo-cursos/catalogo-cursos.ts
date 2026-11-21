import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursoService } from '../../../../core/services/curso.service';
import { CATEGORIAS_CURSO, CategoriaClave, Curso, categoriaDe } from '../../../../core/models/curso.model';
import { IconoCategoria } from '../../../../shared/components/icono-categoria/icono-categoria';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Académico > Catálogo de Cursos.
 * Los cursos de aquí son los que se agregan a cada sección (y dan color al horario).
 */
@Component({
  selector: 'app-catalogo-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, IconoCategoria],
  templateUrl: './catalogo-cursos.html',
})
export class CatalogoCursos implements OnInit {
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);
  /** Servicio ConfirmService (inyectado por Angular). */
  private confirmar = inject(ConfirmService);

  /** Servicio CursoService (inyectado por Angular). */
  private cursoService = inject(CursoService);

  readonly categorias = CATEGORIAS_CURSO;
  readonly categoriaDe = categoriaDe;

  /** Estado (signal): cursos. */
  cursos = signal<Curso[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): aviso. */
  aviso = signal<string | null>(null);

  /** Estado (signal): filtro. */
  filtro = signal<CategoriaClave | null>(null);
  /** Estado (signal): búsqueda. */
  busqueda = signal('');
  /** Estado (signal): menú abierto. */
  menuAbierto = signal<number | null>(null);

  // Panel Nuevo / Editar curso
  panelAbierto = signal(false);
  /** Estado (signal): editando. */
  editando = signal<Curso | null>(null);
  /** Estado (signal): nombre. */
  nombre = signal('');
  /** Estado (signal): categoría. */
  categoria = signal<CategoriaClave | null>(null);
  /** Estado (signal): lista categorías. */
  listaCategorias = signal(false);
  /** Estado (signal): guardando. */
  guardando = signal(false);
  /** Estado (signal): error panel. */
  errorPanel = signal<string | null>(null);

  /** Valor calculado (computed): conteo. Se actualiza solo. */
  conteo = computed(() => {
    const m = new Map<string, number>();
    for (const c of this.cursos()) m.set(c.categoria, (m.get(c.categoria) ?? 0) + 1);
    return m;
  });

  /** Valor calculado (computed): filtrados. Se actualiza solo. */
  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    const f = this.filtro();
    return this.cursos().filter(c => (!f || c.categoria === f) && (!t || c.nombre.toLowerCase().includes(t)));
  });

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void {
    this.cargar();
  }

  /**
   * Carga los datos de esta pantalla. Pide los datos al backend con cursoService.listar() y actualiza
   * la pantalla cuando llega la respuesta.
   */
  cargar(): void {
    this.cargando.set(true);
    this.cursoService.listar().subscribe({
      next: (c) => { this.cursos.set(c); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  // ---------------- Menú ⋮ ----------------

  alternarMenu(c: Curso, ev: Event): void {
    ev.stopPropagation();
    this.menuAbierto.set(this.menuAbierto() === c.id ? null : c.id);
  }

  /** Cierra menus. */
  @HostListener('document:click')
  cerrarMenus(): void {
    this.menuAbierto.set(null);
    this.listaCategorias.set(false);
  }

  /** Se ejecuta al presionar la tecla Esc: cierra la ventana o el menú que esté abierto. */
  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.listaCategorias()) { this.listaCategorias.set(false); return; }
    this.menuAbierto.set(null);
    this.panelAbierto.set(false);
  }

  // ---------------- Nuevo / Editar ----------------

  abrirNuevo(): void {
    this.editando.set(null);
    this.nombre.set('');
    this.categoria.set(this.filtro());
    this.abrirPanel();
  }

  /** Abre editar. */
  abrirEditar(c: Curso): void {
    this.menuAbierto.set(null);
    this.editando.set(c);
    this.nombre.set(c.nombre);
    this.categoria.set(c.categoria);
    this.abrirPanel();
  }

  /** Abre panel. */
  private abrirPanel(): void {
    this.errorPanel.set(null);
    this.listaCategorias.set(false);
    this.panelAbierto.set(true);
  }

  /** Muestra u oculta categorías. */
  alternarCategorias(ev: Event): void {
    ev.stopPropagation();
    this.listaCategorias.set(!this.listaCategorias());
  }

  /** Elige categoría. */
  elegirCategoria(clave: CategoriaClave, ev: Event): void {
    ev.stopPropagation();
    this.categoria.set(clave);
    this.listaCategorias.set(false);
    this.errorPanel.set(null);
  }

  /** Guarda los datos de esta pantalla. Muestra un aviso (toast) con el resultado. */
  guardar(): void {
    const nombre = this.nombre().trim().replace(/\s+/g, ' ');
    const categoria = this.categoria();
    if (!nombre) { this.errorPanel.set('Ingresa el nombre del curso.'); return; }
    if (nombre.length < 3) { this.errorPanel.set('El nombre del curso debe tener al menos 3 caracteres.'); return; }
    if (!categoria) { this.errorPanel.set('Selecciona una categoría.'); return; }
    const ed = this.editando();
    this.guardando.set(true);
    this.errorPanel.set(null);
    (ed ? this.cursoService.actualizar(ed.id, { nombre, categoria }) : this.cursoService.crear({ nombre, categoria })).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.panelAbierto.set(false);
        this.toast.exito(ed ? `Se actualizó el curso ${c.nombre}.` : `Se agregó ${c.nombre} al catálogo (${c.categoriaNombre}).`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(err?.error?.mensaje ?? 'No se pudo guardar el curso.');
      },
    });
  }

  /**
   * Elimina los datos de esta pantalla. Pide los datos al backend con cursoService.eliminar() y
   * actualiza la pantalla cuando llega la respuesta. Muestra un aviso (toast) con el resultado. Antes
   * pide confirmación al usuario.
   */
  async eliminar(c: Curso): Promise<void> {
    this.menuAbierto.set(null);
    const extra = c.secciones
      ? `\n\nEstá asignado a ${c.secciones} sección(es): lo conservarán, pero ya no se podrá agregar a otras.`
      : '';
    if (!await this.confirmar.pedir(`¿Eliminar "${c.nombre}" del catálogo?${extra}`)) return;
    this.cursoService.eliminar(c.id).subscribe({
      next: (r) => {
        this.toast.exito(r.seccionesQueLoConservan
          ? `"${c.nombre}" salió del catálogo. ${r.seccionesQueLoConservan} sección(es) lo conservan con su horario.`
          : `Se eliminó "${c.nombre}" del catálogo.`);
        this.cargar();
      },
      error: (err) => this.error.set(err?.error?.mensaje ?? 'No se pudo eliminar el curso.'),
    });
  }
}

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
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private cursoService = inject(CursoService);

  readonly categorias = CATEGORIAS_CURSO;
  readonly categoriaDe = categoriaDe;

  cursos = signal<Curso[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  filtro = signal<CategoriaClave | null>(null);
  busqueda = signal('');
  menuAbierto = signal<number | null>(null);

  // Panel Nuevo / Editar curso
  panelAbierto = signal(false);
  editando = signal<Curso | null>(null);
  nombre = signal('');
  categoria = signal<CategoriaClave | null>(null);
  listaCategorias = signal(false);
  guardando = signal(false);
  errorPanel = signal<string | null>(null);

  conteo = computed(() => {
    const m = new Map<string, number>();
    for (const c of this.cursos()) m.set(c.categoria, (m.get(c.categoria) ?? 0) + 1);
    return m;
  });

  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    const f = this.filtro();
    return this.cursos().filter(c => (!f || c.categoria === f) && (!t || c.nombre.toLowerCase().includes(t)));
  });

  ngOnInit(): void {
    this.cargar();
  }

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

  @HostListener('document:click')
  cerrarMenus(): void {
    this.menuAbierto.set(null);
    this.listaCategorias.set(false);
  }

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

  abrirEditar(c: Curso): void {
    this.menuAbierto.set(null);
    this.editando.set(c);
    this.nombre.set(c.nombre);
    this.categoria.set(c.categoria);
    this.abrirPanel();
  }

  private abrirPanel(): void {
    this.errorPanel.set(null);
    this.listaCategorias.set(false);
    this.panelAbierto.set(true);
  }

  alternarCategorias(ev: Event): void {
    ev.stopPropagation();
    this.listaCategorias.set(!this.listaCategorias());
  }

  elegirCategoria(clave: CategoriaClave, ev: Event): void {
    ev.stopPropagation();
    this.categoria.set(clave);
    this.listaCategorias.set(false);
    this.errorPanel.set(null);
  }

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

import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth';
import { ComunicadoService } from '../../../../core/services/comunicado.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import {
  Comunicado, ComunicadoRequest, GRUPOS_DESTINO, GrupoDestino, SeccionDestino, etiquetaGrupo,
} from '../../../../core/models/comunicado.model';
import { anioDe, fechaLarga, haceCuanto, iniciales, textoPlano } from '../../../../core/utils/texto';
import { EditorTexto } from '../../../../shared/components/editor-texto/editor-texto';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

type FiltroLectura = 'todos' | 'leidos' | 'no-leidos';
type ModoDocente = 'PADRES_TODAS' | 'ALUMNOS_TODAS' | 'PADRES_UNA' | 'ALUMNOS_UNA';

const IMAGEN_MAX_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-lista-comunicados',
  standalone: true,
  imports: [FotoUsuario, CommonModule, FormsModule, EditorTexto],
  templateUrl: './lista-comunicados.html',
})
export class ListaComunicados implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  readonly grupos = GRUPOS_DESTINO;
  readonly etiquetaGrupo = etiquetaGrupo;
  readonly haceCuanto = haceCuanto;
  readonly fechaLarga = fechaLarga;
  readonly textoPlano = textoPlano;
  readonly iniciales = iniciales;

  private auth = inject(AuthService);
  private comunicadoService = inject(ComunicadoService);
  private notificaciones = inject(NotificacionService);

  private usuario = this.auth.obtenerUsuario();
  /** Administrador, o Directiva con el permiso "Crear comunicados". */
  readonly esAdmin = this.auth.tienePermiso('COMUNICADOS');
  /** HU-25: el docente publica comunicados para los alumnos y/o padres de sus secciones. */
  readonly esDocente = ['docente', 'profesor'].includes(this.auth.obtenerRol().toLowerCase());
  readonly puedeCrear = this.esAdmin || this.esDocente;

  /** Grupos que se pueden elegir (el docente solo Alumnos y Padres). */
  readonly gruposDisponibles = this.esAdmin
    ? GRUPOS_DESTINO
    : GRUPOS_DESTINO.filter(g => g.valor === 'ALUMNOS' || g.valor === 'PADRES');

  /** Secciones a las que puede dirigir el comunicado. */
  seccionesDisponibles = signal<SeccionDestino[]>([]);
  fSecciones = signal<number[]>([]);

  /** Docente: a quién va dirigido (padres o alumnos, de todas sus clases o de una). */
  readonly opcionesDocente: { valor: ModoDocente; etiqueta: string }[] = [
    { valor: 'PADRES_TODAS', etiqueta: 'Todos los padres de las aulas dictadas' },
    { valor: 'ALUMNOS_TODAS', etiqueta: 'Todos los alumnos de las clases dictadas' },
    { valor: 'PADRES_UNA', etiqueta: 'Todos los padres de una clase' },
    { valor: 'ALUMNOS_UNA', etiqueta: 'Todos los alumnos de una clase' },
  ];
  fModoDocente = signal<ModoDocente | ''>('');
  fClase = signal<number | null>(null);

  comunicados = signal<Comunicado[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = signal('');
  anio = signal<number>(new Date().getFullYear());
  filtro = signal<FiltroLectura>('todos');

  // Panel de detalle (lateral)
  detalle = signal<Comunicado | null>(null);

  // Anuncio grande (modal centrado)
  anuncioActual = signal<Comunicado | null>(null);
  private anunciosMostrados = new Set<number>();

  // Modal crear / editar
  modalAbierto = signal(false);
  editandoId = signal<number | null>(null);
  guardando = signal(false);
  errorModal = signal<string | null>(null);
  selectorGruposAbierto = signal(false);
  fTitulo = '';
  fContenido = '';
  fImagen = signal<string | null>(null);
  fAnuncio = signal(false);
  fGrupos = signal<GrupoDestino[]>([]);

  anios = computed(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    this.comunicados().forEach(c => set.add(anioDe(c.fechaCreacion)));
    return [...set].sort((a, b) => b - a);
  });

  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.comunicados().filter(c => {
      if (anioDe(c.fechaCreacion) !== this.anio()) return false;
      if (this.filtro() === 'leidos' && !c.leido) return false;
      if (this.filtro() === 'no-leidos' && c.leido) return false;
      if (!texto) return true;
      return c.titulo.toLowerCase().includes(texto)
        || textoPlano(c.contenido).toLowerCase().includes(texto)
        || c.autorNombre.toLowerCase().includes(texto);
    });
  });

  noLeidos = computed(() => this.comunicados().filter(c => !c.leido).length);

  ngOnInit(): void {
    // Los anuncios importantes sin leer ya se muestran al entrar a la cuenta (AvisosInicio en el Layout).
    this.cargar();
    if (this.puedeCrear && this.usuario) {
      this.comunicadoService.secciones(this.usuario.id).subscribe({
        next: (s) => this.seccionesDisponibles.set(s),
      });
    }
  }

  cargar(mostrarAnuncio = false): void {
    if (!this.usuario) return;
    this.cargando.set(true);
    this.comunicadoService.listar(this.usuario.id).subscribe({
      next: (data) => {
        this.comunicados.set(data);
        this.cargando.set(false);
        if (mostrarAnuncio) this.siguienteAnuncio();
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor.');
        this.cargando.set(false);
      },
    });
  }

  // ---------------- Anuncio grande ----------------

  /** Muestra el anuncio más reciente que el usuario todavía no ha leído. */
  private siguienteAnuncio(): void {
    const pendiente = this.comunicados().find(c => c.anuncio && !c.leido && !this.anunciosMostrados.has(c.id));
    this.anuncioActual.set(pendiente ?? null);
  }

  cerrarAnuncio(): void {
    const a = this.anuncioActual();
    if (!a) return;
    this.anunciosMostrados.add(a.id);
    this.marcarLeido(a);
    this.anuncioActual.set(null);
    // Si había más de un anuncio sin leer, aparece el siguiente.
    setTimeout(() => this.siguienteAnuncio(), 250);
  }

  // ---------------- Detalle ----------------

  abrirDetalle(c: Comunicado): void {
    this.detalle.set(c);
    this.marcarLeido(c);
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  private marcarLeido(c: Comunicado): void {
    if (c.leido || !this.usuario) return;
    this.comunicadoService.marcarLeido(c.id, this.usuario.id).subscribe({
      next: () => {
        this.comunicados.update(lista => lista.map(x => x.id === c.id ? { ...x, leido: true } : x));
        this.notificaciones.refrescar();
      },
    });
  }

  // ---------------- Crear / editar (solo administración) ----------------

  abrirCrear(): void {
    this.editandoId.set(null);
    this.fTitulo = '';
    this.fContenido = '';
    this.fImagen.set(null);
    this.fAnuncio.set(false);
    this.fGrupos.set(this.esAdmin ? [] : ['ALUMNOS', 'PADRES']);
    const secciones = this.seccionesDisponibles();
    this.fSecciones.set(!this.esAdmin && secciones.length === 1 ? [secciones[0].id] : []);
    this.fModoDocente.set('');
    this.fClase.set(null);
    this.errorModal.set(null);
    this.errores.set({});
    this.modalAbierto.set(true);
  }

  abrirEditar(c: Comunicado, ev?: Event): void {
    ev?.stopPropagation();
    this.detalle.set(null);
    this.editandoId.set(c.id);
    this.fTitulo = c.titulo;
    this.fContenido = c.contenido;
    this.fImagen.set(c.imagen);
    this.fAnuncio.set(c.anuncio);
    this.fGrupos.set(c.destinatarios.includes('TODOS') ? ['TODOS', ...this.individuales] : [...c.destinatarios]);
    this.fSecciones.set([...(c.seccionIds ?? [])]);
    if (this.esDocente && !this.esAdmin) {
      const ids = c.seccionIds ?? [];
      const todas = ids.length > 1 && ids.length >= this.seccionesDisponibles().length;
      const grupo = c.destinatarios.includes('PADRES') ? 'PADRES' : 'ALUMNOS';
      this.fModoDocente.set(`${grupo}_${todas ? 'TODAS' : 'UNA'}` as ModoDocente);
      this.fClase.set(todas ? null : ids[0] ?? null);
    }
    this.errorModal.set(null);
    this.errores.set({});
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.selectorGruposAbierto.set(false);
  }

  alternarSeccion(id: number): void {
    this.fSecciones.update(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id]);
  }

  /** Grupos individuales (sin "Todos"). */
  private readonly individuales = this.gruposDisponibles.map(x => x.valor).filter(v => v !== 'TODOS');

  /**
   * "Todos" marca (o desmarca) todas las casillas. Si se marcan los grupos uno por uno hasta tenerlos
   * todos, "Todos" se marca solo; si se desmarca uno, "Todos" se desmarca.
   */
  alternarGrupo(g: GrupoDestino): void {
    this.limpiarError('destino');
    this.fGrupos.update(lista => {
      if (g === 'TODOS') return lista.includes('TODOS') ? [] : ['TODOS', ...this.individuales];
      const sinTodos = lista.filter(x => x !== 'TODOS');
      const nueva = sinTodos.includes(g) ? sinTodos.filter(x => x !== g) : [...sinTodos, g];
      const completos = this.esAdmin && this.individuales.every(v => nueva.includes(v));
      return completos ? ['TODOS', ...this.individuales] : nueva;
    });
  }

  nombresSecciones(): string {
    return this.seccionesDisponibles().map(x => x.nombre).join(', ');
  }

  resumenGrupos(): string {
    const g = this.fGrupos();
    if (!g.length) return 'Seleccionar grupo(s)';
    if (g.includes('TODOS')) return 'Todos (administrativos, docentes, alumnos y padres)';
    return g.map(etiquetaGrupo).join(', ');
  }

  elegirImagen(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(archivo.type)) {
      this.errorModal.set('La imagen debe ser JPG, PNG, WEBP o GIF.');
      return;
    }
    if (archivo.size > IMAGEN_MAX_BYTES) {
      this.errorModal.set('La imagen no puede pesar más de 2 MB.');
      return;
    }
    const lector = new FileReader();
    // Con signals la vista se actualiza aunque esto ocurra fuera de un evento de Angular.
    lector.onload = () => this.fImagen.set(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  /** Errores por campo del formulario (se muestran debajo de cada uno). */
  errores = signal<Record<string, string>>({});

  /** Valida el formulario completo; devuelve true si está correcto. */
  private validar(): boolean {
    const e: Record<string, string> = {};
    const titulo = this.fTitulo.trim();
    if (!titulo) e['titulo'] = 'Escribe el título del comunicado.';
    else if (titulo.length < 5) e['titulo'] = 'El título debe tener al menos 5 caracteres.';
    else if (titulo.length > 200) e['titulo'] = 'El título no puede superar los 200 caracteres.';

    if (this.esDocente && !this.esAdmin) {
      const modo = this.fModoDocente();
      if (!this.seccionesDisponibles().length) e['destino'] = 'No tienes secciones activas para enviar comunicados.';
      else if (!modo) e['destino'] = 'Selecciona el destinatario.';
      else if (modo.endsWith('_UNA') && !this.fClase()) e['clase'] = 'Selecciona la clase.';
    } else if (!this.fGrupos().length) {
      e['destino'] = 'Selecciona a quién va dirigido.';
    }

    const texto = textoPlano(this.fContenido).trim();
    if (!texto) e['mensaje'] = 'Escribe el mensaje del comunicado.';
    else if (texto.length < 10) e['mensaje'] = 'El mensaje es muy corto (mínimo 10 caracteres).';

    this.errores.set(e);
    const n = Object.keys(e).length;
    this.errorModal.set(n ? `Revisa ${n === 1 ? 'el campo marcado' : 'los ' + n + ' campos marcados'} en rojo.` : null);
    return n === 0;
  }

  limpiarError(campo: string): void {
    if (!this.errores()[campo]) return;
    this.errores.update(e => { const n = { ...e }; delete n[campo]; return n; });
  }

  guardar(): void {
    if (!this.usuario) return;
    if (!this.validar()) return;
    if (this.esDocente && !this.esAdmin) {
      const [grupo, alcance] = this.fModoDocente().split('_');
      this.fGrupos.set([grupo as GrupoDestino]);
      this.fSecciones.set(alcance === 'UNA' ? [this.fClase()!] : this.seccionesDisponibles().map(x => x.id));
    } else {
      // Administración y Directiva: el comunicado va a todo el colegio (según los destinatarios elegidos).
      this.fSecciones.set([]);
    }

    const datos: ComunicadoRequest = {
      titulo: this.fTitulo.trim(),
      contenido: this.fContenido,
      imagen: this.fImagen(),
      anuncio: this.fAnuncio(),
      // Con "Todos" marcado basta con enviar TODOS (el backend lo guarda así).
      destinatarios: this.fGrupos().includes('TODOS') ? ['TODOS'] : this.fGrupos(),
      secciones: this.fSecciones(),
    };
    const id = this.editandoId();
    const peticion = id
      ? this.comunicadoService.actualizar(id, this.usuario.id, datos)
      : this.comunicadoService.crear(this.usuario.id, datos);

    this.guardando.set(true);
    this.errorModal.set(null);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito(id ? 'Comunicado actualizado.' : 'Comunicado publicado correctamente.');
        this.cerrarModal();
        this.anio.set(new Date().getFullYear());
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'No se pudo guardar el comunicado.');
      },
    });
  }

  async eliminar(c: Comunicado, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    if (!this.usuario) return;
    if (!await this.confirmar.pedir(`¿Eliminar el comunicado "${c.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.comunicadoService.eliminar(c.id, this.usuario.id).subscribe({
      next: () => {
        this.detalle.set(null);
        this.cargar();
        this.notificaciones.refrescar();
        this.toast.exito('Comunicado eliminado.');
      },
      error: (err) => this.toast.error(err?.error?.mensaje ?? 'No se pudo eliminar el comunicado.'),
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.selectorGruposAbierto()) { this.selectorGruposAbierto.set(false); return; }
    if (this.modalAbierto()) { this.cerrarModal(); return; }
    if (this.detalle()) { this.cerrarDetalle(); }
  }

  listaGrupos(c: Comunicado): string {
    const grupos = c.destinatarios.map(etiquetaGrupo).join(', ');
    return c.secciones?.length ? `${grupos} de ${c.secciones.join(', ')}` : grupos;
  }

  claseChip(activo: boolean): string {
    return activo
      ? 'bg-[#EFEAF3] text-[#4A1F52] border-[#4A1F52]/20'
      : 'bg-white text-[#241521] border-[#E3D5C4] hover:bg-[#FAF6EF]';
  }
}

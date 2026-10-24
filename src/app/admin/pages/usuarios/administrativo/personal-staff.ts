import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth';
import { PersonalService } from '../../../../core/services/personal.service';
import { CARGOS_SUGERIDOS, Personal, PersonalRequest } from '../../../../core/models/personal.model';
import { PERMISOS } from '../../../../core/models/permiso.model';
import { usuarioConDni, PREFIJO_USUARIO } from '../../../../core/models/usuario.model';
import { TIPOS_DOCUMENTO, TipoDocumento, errorDocumento, infoDocumento, limpiarDocumento } from '../../../../core/models/documento.model';
import { fechaLarga, iniciales } from '../../../../core/utils/texto';
import { CampoPassword } from '../../../../shared/components/campo-password/campo-password';
import { UsersAndRoles } from './users-and-roles';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

import { FiltroEntrada } from '../../../../shared/components/error-campo/filtro-entrada';
import { Val, revisar, primerError, soloDigitos, limpiarTexto } from '../../../../core/utils/validadores';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';
type Pestana = 'staff' | 'cuentas';

interface Formulario {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  cargo: string;
  password: string;
  confirmarPassword: string;
}

const VACIO: Formulario = {
  tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
  correo: '', telefono: '', fechaNacimiento: '', cargo: '', password: '', confirmarPassword: '',
};

/**
 * "Gestión de Personal Staff" (Directiva). Cuentas DIR + N.º de documento.
 * - Administrador: registra, edita, activa/desactiva y GESTIONA PERMISOS.
 * - Directiva con "Gestión de Usuarios": registra, edita y activa/desactiva (no permisos).
 * - Nadie puede modificar su propio registro desde aquí.
 */
@Component({
  selector: 'app-personal-staff',
  standalone: true,
  imports: [FotoUsuario, FiltroEntrada, CommonModule, FormsModule, CampoPassword, UsersAndRoles],
  templateUrl: './personal-staff.html',
})
export class PersonalStaff implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  private auth = inject(AuthService);
  private personalService = inject(PersonalService);

  readonly permisosDisponibles = PERMISOS;
  readonly cargosSugeridos = CARGOS_SUGERIDOS;
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly infoDocumento = infoDocumento;
  readonly iniciales = iniciales;
  readonly fechaLarga = fechaLarga;
  readonly esAdmin = this.auth.esAdministrador();
  /** Administrador, o Directiva con "Gestionar permisos" (p.ej. el Director). */
  readonly puedeGestionarPermisos = this.auth.tienePermiso('PERMISOS');
  private misPermisos = this.auth.obtenerUsuario()?.permisos ?? [];
  private miId = this.auth.obtenerUsuario()?.id ?? null;

  pestana = signal<Pestana>('staff');
  personal = signal<Personal[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  busqueda = signal('');
  porPagina = signal(20);
  pagina = signal(1);
  menuAbierto = signal<number | null>(null);

  // Detalle
  detalle = signal<Personal | null>(null);

  // Crear / editar
  modalAbierto = signal(false);
  editando = signal<Personal | null>(null);
  f = signal<Formulario>({ ...VACIO });
  guardando = signal(false);
  errorModal = signal<string | null>(null);

  // Combobox de cargo
  cargoAbierto = signal(false);
  cargoResaltado = signal(-1);
  /** Filtra por lo escrito; si ya coincide con un cargo de la lista, la muestra completa. */
  cargosFiltrados = computed(() => {
    const t = this.f().cargo.trim().toLowerCase();
    if (!t || this.cargosSugeridos.some(c => c.toLowerCase() === t)) return [...this.cargosSugeridos];
    return this.cargosSugeridos.filter(c => c.toLowerCase().includes(t));
  });

  // Permisos
  permisosDe = signal<Personal | null>(null);
  permisosMarcados = signal<string[]>([]);
  guardandoPermisos = signal(false);

  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    return this.personal().filter(p => !t
      || p.nombreCompleto.toLowerCase().includes(t)
      || p.numeroDocumento.includes(t)
      || (p.cargo ?? '').toLowerCase().includes(t)
      || (p.correo ?? '').toLowerCase().includes(t)
      || (p.usuario ?? '').toLowerCase().includes(t));
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina())));
  paginaDatos = computed(() => {
    const ini = (this.pagina() - 1) * this.porPagina();
    return this.filtrados().slice(ini, ini + this.porPagina());
  });
  rango = computed(() => {
    const total = this.filtrados().length;
    if (!total) return '0 de 0';
    const ini = (this.pagina() - 1) * this.porPagina() + 1;
    return `${ini} - ${Math.min(total, ini + this.porPagina() - 1)} de ${total}`;
  });
  paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
    .filter(n => n === 1 || n === this.totalPaginas() || Math.abs(n - this.pagina()) <= 1));

  /** Avance del formulario (barra superior del modal): campos obligatorios completos. */
  avance = computed(() => {
    const f = this.f();
    const oblig = [f.numeroDocumento, f.nombres, f.apellidoPaterno, f.cargo];
    return Math.round(oblig.filter(v => v.trim()).length / oblig.length * 100);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.personalService.listar().subscribe({
      next: (d) => { this.personal.set(d); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  esYo(p: Personal): boolean {
    return this.miId !== null && p.usuarioId === this.miId;
  }

  nombreTabla(p: Personal): string {
    const apellidos = [p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ');
    return `${apellidos}, ${p.nombres}`;
  }

  nombrePermiso(valor: string): string {
    return PERMISOS.find(x => x.valor === valor)?.titulo ?? valor;
  }

  nombreFormulario(): string {
    const f = this.f();
    return [f.nombres, f.apellidoPaterno, f.apellidoMaterno].map(x => x.trim()).filter(Boolean).join(' ');
  }

  usuarioPreview(): string {
    return usuarioConDni(PREFIJO_USUARIO.DIRECTIVA, this.f().numeroDocumento);
  }

  setCampo<K extends keyof Formulario>(campo: K, valor: Formulario[K]): void {
    this.f.update(f => ({ ...f, [campo]: valor }));
  }

  // ---------------- Menú ⋮ ----------------

  alternarMenu(p: Personal, ev: Event): void {
    ev.stopPropagation();
    this.menuAbierto.set(this.menuAbierto() === p.id ? null : p.id);
  }

  @HostListener('document:click')
  cerrarMenu(): void {
    this.menuAbierto.set(null);
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    this.menuAbierto.set(null);
    if (this.cargoAbierto()) { this.cargoAbierto.set(false); return; }
    if (this.permisosDe()) { this.permisosDe.set(null); return; }
    if (this.modalAbierto()) { this.cerrarFormulario(); return; }
    this.detalle.set(null);
  }

  // ---------------- Crear / editar ----------------

  abrirNuevo(): void {
    this.editando.set(null);
    this.f.set({ ...VACIO });
    this.errorModal.set(null);
    this.cargoAbierto.set(false);
    this.cargoResaltado.set(-1);
    this.modalAbierto.set(true);
  }

  abrirEditar(p: Personal): void {
    this.menuAbierto.set(null);
    this.detalle.set(null);
    if (this.esYo(p)) return;
    this.editando.set(p);
    this.f.set({
      tipoDocumento: p.tipoDocumento, numeroDocumento: p.numeroDocumento, nombres: p.nombres,
      apellidoPaterno: p.apellidoPaterno, apellidoMaterno: p.apellidoMaterno ?? '', correo: p.correo ?? '',
      telefono: p.telefono ?? '', fechaNacimiento: p.fechaNacimiento ?? '', cargo: p.cargo ?? '',
      password: '', confirmarPassword: '',
    });
    this.errorModal.set(null);
    this.cargoAbierto.set(false);
    this.cargoResaltado.set(-1);
    this.modalAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.cargoAbierto.set(false);
    this.modalAbierto.set(false);
  }

  // ---------------- Combobox de cargo ----------------

  escribirCargo(valor: string): void {
    this.setCampo('cargo', valor);
    this.cargoAbierto.set(true);
    this.cargoResaltado.set(-1);
  }

  elegirCargo(c: string): void {
    this.setCampo('cargo', c);
    this.cargoAbierto.set(false);
  }

  alternarListaCargos(input: HTMLInputElement | null): void {
    if (this.cargoAbierto()) { this.cargoAbierto.set(false); return; }
    input?.focus();
    this.cargoAbierto.set(true);
  }

  /** Flechas para moverse, Enter para elegir, Escape para cerrar la lista. */
  teclaCargo(ev: KeyboardEvent): void {
    const lista = this.cargosFiltrados();
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      this.cargoAbierto.set(true);
      if (!lista.length) return;
      const paso = ev.key === 'ArrowDown' ? 1 : -1;
      this.cargoResaltado.set((this.cargoResaltado() + paso + lista.length) % lista.length);
    } else if (ev.key === 'Enter') {
      const i = this.cargoResaltado();
      if (this.cargoAbierto() && i >= 0 && i < lista.length) { ev.preventDefault(); this.elegirCargo(lista[i]); }
    } else if (ev.key === 'Escape' && this.cargoAbierto()) {
      ev.stopPropagation();
      this.cargoAbierto.set(false);
    } else if (ev.key === 'Tab') {
      this.cargoAbierto.set(false);
    }
  }

  guardar(): void {
    const f = this.f();
    const doc = limpiarDocumento(f.numeroDocumento);
    const errDoc = errorDocumento(f.tipoDocumento, doc);
    if (errDoc) { this.errorModal.set(errDoc); return; }
    const errCampo = primerError(
      revisar(f.nombres, Val.letras('los nombres', 100, true)),
      revisar(f.apellidoPaterno, Val.letras('el apellido paterno', 60, true)),
      revisar(f.apellidoMaterno, Val.letras('el apellido materno', 60)),
      revisar(f.correo, Val.correo()),
      revisar(f.telefono, Val.telefono()),
      revisar(f.fechaNacimiento, Val.fechaNacimiento(18, 100)),
      f.cargo.trim() ? revisar(f.cargo, Val.texto('el cargo', 3, 100)) : 'Indica el cargo o puesto institucional.',
      revisar(f.password, Val.password()),
    );
    if (errCampo) { this.errorModal.set(errCampo); return; }
    if (f.password !== f.confirmarPassword) { this.errorModal.set('Las contraseñas no coinciden.'); return; }

    const datos: PersonalRequest = {
      tipoDocumento: f.tipoDocumento, numeroDocumento: doc, nombres: limpiarTexto(f.nombres),
      apellidoPaterno: limpiarTexto(f.apellidoPaterno), apellidoMaterno: limpiarTexto(f.apellidoMaterno) || null,
      correo: f.correo.trim() || null, telefono: soloDigitos(f.telefono) || null,
      fechaNacimiento: f.fechaNacimiento || null, cargo: f.cargo.trim(), password: f.password || null,
    };
    const ed = this.editando();
    this.guardando.set(true);
    this.errorModal.set(null);
    (ed ? this.personalService.actualizar(ed.id, datos) : this.personalService.crear(datos)).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.cerrarFormulario();
        this.toast.exito(ed
          ? `Se actualizaron los datos de ${p.nombreCompleto}.`
          : `Se registró a ${p.nombreCompleto}. Usuario: ${p.usuario} · Contraseña inicial: ${f.password ? 'la indicada' : 'su N.º de documento'}.`);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'No se pudo guardar el registro.');
      },
    });
  }

  // ---------------- Activar / desactivar ----------------

  async alternarEstado(p: Personal): Promise<void> {
    this.menuAbierto.set(null);
    if (this.esYo(p)) return;
    const activar = p.estado === 'Inactivo';
    if (!activar && !await this.confirmar.pedir(`¿Desactivar la cuenta de ${p.nombreCompleto}? No podrá iniciar sesión.`)) return;
    this.personalService.cambiarEstado(p.id, activar).subscribe({
      next: (act) => {
        this.personal.update(l => l.map(x => x.id === act.id ? act : x));
        if (this.detalle()?.id === act.id) this.detalle.set(act);
        this.toast.exito(activar ? 'Cuenta activada.' : 'Cuenta desactivada.');
      },
      error: (err) => this.toast.error(err?.error?.mensaje ?? 'No se pudo cambiar el estado.'),
    });
  }

  // ---------------- Permisos (solo administrador) ----------------

  abrirPermisos(p: Personal): void {
    this.menuAbierto.set(null);
    if (!this.puedeGestionarPermisos || this.esYo(p)) return;
    this.permisosDe.set(p);
    this.permisosMarcados.set([...p.permisos]);
  }

  /** El admin cambia cualquiera; la Directiva solo los que ella misma tiene. */
  puedoCambiarPermiso(valor: string): boolean {
    return this.esAdmin || this.misPermisos.includes(valor);
  }

  /** Permisos que el usuario actual puede cambiar. */
  private permisosCambiables(): string[] {
    return this.permisosDisponibles.map(x => x.valor).filter(v => this.puedoCambiarPermiso(v));
  }

  /** "Seleccionar todos" está marcado cuando todos los permisos que puede cambiar están marcados. */
  todosMarcados(): boolean {
    const c = this.permisosCambiables();
    return c.length > 0 && c.every(v => this.permisosMarcados().includes(v));
  }

  algunoMarcado(): boolean {
    return !this.todosMarcados() && this.permisosCambiables().some(v => this.permisosMarcados().includes(v));
  }

  /** Marca o desmarca todas las casillas (solo las que puede cambiar). */
  alternarTodos(marcar: boolean): void {
    const c = this.permisosCambiables();
    this.permisosMarcados.update(l => marcar ? [...new Set([...l, ...c])] : l.filter(x => !c.includes(x)));
  }

  alternarPermiso(valor: string, marcado: boolean): void {
    if (!this.puedoCambiarPermiso(valor)) return;
    this.permisosMarcados.update(l => marcado ? [...new Set([...l, valor])] : l.filter(x => x !== valor));
  }

  guardarPermisos(): void {
    const p = this.permisosDe();
    if (!p) return;
    this.guardandoPermisos.set(true);
    this.personalService.actualizarPermisos(p.id, this.permisosMarcados()).subscribe({
      next: (act) => {
        this.guardandoPermisos.set(false);
        this.permisosDe.set(null);
        this.personal.update(l => l.map(x => x.id === act.id ? act : x));
        this.toast.exito(`Permisos de ${act.nombreCompleto} actualizados.`);
      },
      error: (err) => {
        this.guardandoPermisos.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudieron guardar los permisos.');
        this.permisosDe.set(null);
      },
    });
  }

  abrirDetalle(p: Personal): void {
    this.menuAbierto.set(null);
    this.detalle.set(p);
  }

  irAPagina(n: number): void {
    if (n >= 1 && n <= this.totalPaginas()) this.pagina.set(n);
  }
}

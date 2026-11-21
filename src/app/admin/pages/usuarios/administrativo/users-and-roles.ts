import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { PREFIJO_USUARIO, ROLES_SISTEMA, Usuario, etiquetaRol, usuarioConDni } from '../../../../core/models/usuario.model';
import { CampoPassword } from '../../../../shared/components/campo-password/campo-password';
import { AuthService } from '../../../../services/auth';
import { ToastService } from '../../../../core/services/toast.service';

import { ErrorCampo } from '../../../../shared/components/error-campo/error-campo';
import { FiltroEntrada } from '../../../../shared/components/error-campo/filtro-entrada';
import { Val, limpiarTexto } from '../../../../core/utils/validadores';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';
/**
 * Componente «users and roles» del panel de Administración (administrador y directiva). Se usa en el
 * HTML con la etiqueta <app-users-and-roles>. Su vista está en users-and-roles.html; aquí (en el .ts)
 * va la lógica: los datos que se muestran, lo que pasa al hacer clic y las llamadas a los servicios.
 */
@Component({
  imports: [FotoUsuario, ErrorCampo, FiltroEntrada, CommonModule, ReactiveFormsModule, FormsModule, CampoPassword],
  selector: 'app-users-and-roles',
  templateUrl: './users-and-roles.html',
})
export class UsersAndRoles implements OnInit {
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);

  roles = ROLES_SISTEMA;
  etiquetaRol = etiquetaRol;

  /** Estado (signal): usuarios. */
  usuarios = signal<Usuario[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): guardando. */
  guardando = signal(false);

  /** Estado (signal): búsqueda. */
  busqueda = signal('');
  /** Estado (signal): filtro rol. */
  filtroRol = signal('');
  /** Estado (signal): filtro estado. */
  filtroEstado = signal('');

  /** Estado (signal): panel abierto. */
  panelAbierto = signal(false);
  /** Estado (signal): modo edicion. */
  modoEdicion = signal(false);
  /** Estado (signal): usuario seleccionado. */
  usuarioSeleccionado = signal<Usuario | null>(null);

  /** Estado (signal): página actual. */
  paginaActual = signal(1);
  porPagina = 8;

  /** Valor calculado (computed): filtrados. Se actualiza solo. */
  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.usuarios().filter(u => {
      const coincideTexto = !texto ||
        u.nombre.toLowerCase().includes(texto) ||
        u.usuario.toLowerCase().includes(texto) ||
        (u.correo ?? '').toLowerCase().includes(texto);
      const coincideRol = !this.filtroRol() || u.rol.toLowerCase() === this.filtroRol().toLowerCase();
      const coincideEstado = !this.filtroEstado() ||
        (this.filtroEstado() === 'activo' ? u.estado : !u.estado);
      return coincideTexto && coincideRol && coincideEstado;
    });
  });

  /** Valor calculado (computed): total páginas. Se actualiza solo. */
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina)));

  /** Valor calculado (computed): página datos. Se actualiza solo. */
  paginaDatos = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina;
    return this.filtrados().slice(inicio, inicio + this.porPagina);
  });

  /** Valor calculado (computed): conteo por rol. Se actualiza solo. */
  conteoPorRol = computed(() => {
    const conteo: Record<string, number> = {};
    for (const u of this.usuarios()) {
      const key = u.rol.toLowerCase();
      conteo[key] = (conteo[key] ?? 0) + 1;
    }
    return conteo;
  });

  form!: ReturnType<FormBuilder['group']>;

  /** Id del administrador logeado: no puede editar, apagar ni eliminar su propia cuenta. */
  private miId: number | null;

  /** Constructor: Angular le entrega (inyecta) los servicios que usa. */
  constructor(private fb: FormBuilder, private usuarioService: UsuarioService, auth: AuthService) {
    this.miId = auth.obtenerUsuario()?.id ?? null;
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Val.letras('el nombre', 100, true)]],
      usuario: [''],
      dni: [''],
      password: [''],
      confirmarPassword: [''],
      rol: ['', Validators.required],
      estado: [true],
    });
  }

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales.
   */
  ngOnInit(): void {
    this.cargar();
    // Según el rol elegido se pide "Usuario" (Administración) o "DNI" (Directiva: DIR + DNI).
    this.form.get('rol')?.valueChanges.subscribe(() => this.ajustarValidadores());
  }

  /** Al crear solo se ofrecen Administración y Directiva; al editar, todos. */
  rolesDelFormulario(): { valor: string; etiqueta: string }[] {
    const todos = [...this.roles];
    // Aquí solo se crean administradores; la Directiva se registra en "Personal Staff".
    return this.modoEdicion() ? todos : todos.filter(r => r.valor === 'ADMIN');
  }

  /** Indica si es directiva (devuelve verdadero o falso). */
  esDirectiva(): boolean {
    return (this.form.get('rol')?.value ?? '').toUpperCase() === 'DIRECTIVO';
  }

  /** Devuelve el texto de «usuario directiva». */
  usuarioDirectiva(): string {
    return usuarioConDni(PREFIJO_USUARIO.DIRECTIVA, this.form.get('dni')?.value);
  }

  /** Realiza la acción «ajustar validadores» de esta pantalla. */
  private ajustarValidadores(): void {
    const vinculado = !!this.usuarioSeleccionado()?.vinculadoA;
    const usuario = this.form.get('usuario')!;
    const dni = this.form.get('dni')!;
    usuario.setValidators(!vinculado && !this.esDirectiva() ? [Val.usuario()] : []);
    dni.setValidators(!vinculado && this.esDirectiva() ? [Validators.required, Validators.pattern(/^\s*[0-9A-Za-z]{8,12}\s*$/)] : []);
    usuario.updateValueAndValidity({ emitEvent: false });
    dni.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Carga los datos de esta pantalla. Pide los datos al backend con usuarioService.listar() y
   * actualiza la pantalla cuando llega la respuesta.
   */
  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: (data) => { this.usuarios.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  /** Abre crear. */
  abrirCrear(): void {
    this.modoEdicion.set(false);
    this.usuarioSeleccionado.set(null);
    this.form.get('rol')?.enable({ emitEvent: false });
    this.form.reset({ nombre: '', usuario: '', dni: '', password: '', confirmarPassword: '', rol: 'ADMIN', estado: true });
    this.error.set(null);
    this.form.get('password')?.setValidators([Val.password(true)]);
    this.form.get('password')?.updateValueAndValidity();
    this.ajustarValidadores();
    this.panelAbierto.set(true);
  }

  /** Indica si es mi cuenta (devuelve verdadero o falso). */
  esMiCuenta(u: Usuario): boolean {
    return this.miId !== null && u.id === this.miId;
  }

  /** Abre editar. */
  abrirEditar(usuario: Usuario): void {
    if (this.esMiCuenta(usuario)) return;
    this.modoEdicion.set(true);
    this.usuarioSeleccionado.set(usuario);
    this.form.reset({
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      dni: usuario.usuario.toUpperCase().startsWith('DIR') ? usuario.usuario.substring(3) : '',
      password: '',
      confirmarPassword: '',
      // La BD puede tener el rol en minúsculas ('alumno', 'docente'...);
      // se busca la opción equivalente para que el select la muestre.
      rol: this.roles.find(r => r.valor.toLowerCase() === (usuario.rol ?? '').toLowerCase())?.valor ?? usuario.rol,
      estado: usuario.estado,
    });
    this.error.set(null);
    // en edición la contraseña es opcional (solo si se quiere cambiar)
    this.form.get('password')?.setValidators([Val.password()]);
    this.form.get('password')?.updateValueAndValidity();
    // Las cuentas de alumno/docente/apoderado no cambian de rol aquí.
    if (usuario.vinculadoA) this.form.get('rol')?.disable({ emitEvent: false });
    else this.form.get('rol')?.enable({ emitEvent: false });
    this.ajustarValidadores();
    this.panelAbierto.set(true);
  }

  /** Cierra panel. */
  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  /** Guarda los datos de esta pantalla. Muestra un aviso (toast) con el resultado. */
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.password && v.password !== v.confirmarPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.error.set(null);
    this.guardando.set(true);

    const directiva = (v.rol ?? '').toUpperCase() === 'DIRECTIVO';
    const payload = {
      nombre: limpiarTexto(v.nombre),
      usuario: directiva ? null : (v.usuario ?? '').trim(),
      dni: directiva ? (v.dni ?? '').trim() : null,
      password: v.password || null,
      rol: v.rol!,
      estado: v.estado ?? true,
    };

    const seleccionado = this.usuarioSeleccionado();
    const peticion = this.modoEdicion() && seleccionado
      ? this.usuarioService.actualizar(seleccionado.id, payload)
      : this.usuarioService.crear(payload);

    peticion.subscribe({
      next: () => { this.guardando.set(false); this.toast.exito(this.modoEdicion() ? 'Usuario actualizado.' : 'Usuario creado correctamente.'); this.cerrarPanel(); this.cargar(); },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'Ocurrió un error al guardar el usuario.');
      },
    });
  }

  /**
   * Muestra u oculta estado. Pide los datos al backend con usuarioService.cambiarEstado() y actualiza
   * la pantalla cuando llega la respuesta. Muestra un aviso (toast) con el resultado.
   */
  toggleEstado(usuario: Usuario): void {
    if (this.esMiCuenta(usuario)) return;
    this.usuarioService.cambiarEstado(usuario.id, !usuario.estado).subscribe({
      next: () => { this.toast.exito(usuario.estado ? 'Usuario desactivado.' : 'Usuario activado.'); this.cargar(); },
      error: (err) => this.toast.error(err?.error?.mensaje ?? 'No se pudo cambiar el estado.'),
    });
  }

  /** Navega a página. */
  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }
}

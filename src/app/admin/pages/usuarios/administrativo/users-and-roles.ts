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
@Component({
  imports: [FotoUsuario, ErrorCampo, FiltroEntrada, CommonModule, ReactiveFormsModule, FormsModule, CampoPassword],
  selector: 'app-users-and-roles',
  templateUrl: './users-and-roles.html',
})
export class UsersAndRoles implements OnInit {
  private toast = inject(ToastService);

  roles = ROLES_SISTEMA;
  etiquetaRol = etiquetaRol;

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = signal('');
  filtroRol = signal('');
  filtroEstado = signal('');

  panelAbierto = signal(false);
  modoEdicion = signal(false);
  usuarioSeleccionado = signal<Usuario | null>(null);

  paginaActual = signal(1);
  porPagina = 8;

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

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina)));

  paginaDatos = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina;
    return this.filtrados().slice(inicio, inicio + this.porPagina);
  });

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

  esDirectiva(): boolean {
    return (this.form.get('rol')?.value ?? '').toUpperCase() === 'DIRECTIVO';
  }

  usuarioDirectiva(): string {
    return usuarioConDni(PREFIJO_USUARIO.DIRECTIVA, this.form.get('dni')?.value);
  }

  private ajustarValidadores(): void {
    const vinculado = !!this.usuarioSeleccionado()?.vinculadoA;
    const usuario = this.form.get('usuario')!;
    const dni = this.form.get('dni')!;
    usuario.setValidators(!vinculado && !this.esDirectiva() ? [Val.usuario()] : []);
    dni.setValidators(!vinculado && this.esDirectiva() ? [Validators.required, Validators.pattern(/^\s*[0-9A-Za-z]{8,12}\s*$/)] : []);
    usuario.updateValueAndValidity({ emitEvent: false });
    dni.updateValueAndValidity({ emitEvent: false });
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: (data) => { this.usuarios.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

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

  esMiCuenta(u: Usuario): boolean {
    return this.miId !== null && u.id === this.miId;
  }

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

  cerrarPanel(): void {
    this.panelAbierto.set(false);
  }

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

  toggleEstado(usuario: Usuario): void {
    if (this.esMiCuenta(usuario)) return;
    this.usuarioService.cambiarEstado(usuario.id, !usuario.estado).subscribe({
      next: () => { this.toast.exito(usuario.estado ? 'Usuario desactivado.' : 'Usuario activado.'); this.cargar(); },
      error: (err) => this.toast.error(err?.error?.mensaje ?? 'No se pudo cambiar el estado.'),
    });
  }

  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }
}

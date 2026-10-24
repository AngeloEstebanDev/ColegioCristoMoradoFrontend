import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PadreService } from '../../../../core/services/padre.service';
import { ESTADOS_PADRE, PadreFamilia } from '../../../../core/models/padre.model';
import { PREFIJO_USUARIO, usuarioConDni } from '../../../../core/models/usuario.model';
import { TIPOS_DOCUMENTO, infoDocumento, limpiarDocumento, validadorDocumento } from '../../../../core/models/documento.model';
import { AuthService } from '../../../../services/auth';
import { RouterLink } from '@angular/router';
import { hoyIso } from '../../../../core/utils/texto';
import { CampoPassword } from '../../../../shared/components/campo-password/campo-password';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

import { ErrorCampo } from '../../../../shared/components/error-campo/error-campo';
import { FiltroEntrada } from '../../../../shared/components/error-campo/filtro-entrada';
import { Val, limpiarTexto, soloDigitos } from '../../../../core/utils/validadores';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';
@Component({
  imports: [FotoUsuario, ErrorCampo, FiltroEntrada, CommonModule, ReactiveFormsModule, FormsModule, CampoPassword, RouterLink],
  selector: 'app-parents',
  templateUrl: './parents.html',
})
export class Parents implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  estadosPosibles = ESTADOS_PADRE;

  padres = signal<PadreFamilia[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = signal('');
  filtroEstado = signal('');
  filtroGrado = signal('');

  paginaActual = signal(1);
  porPagina = 10;

  panelAbierto = signal(false);
  padreSeleccionado = signal<PadreFamilia | null>(null);

  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.padres().filter(p => {
      const coincideTexto = !texto ||
        p.nombreCompleto.toLowerCase().includes(texto) ||
        p.dni.toLowerCase().includes(texto) ||
        (p.usuario ?? '').toLowerCase().includes(texto) ||
        p.estudiantes.some(e => e.nombreCompleto.toLowerCase().includes(texto));
      const coincideEstado = !this.filtroEstado() || p.estado === this.filtroEstado();
      const coincideGrado = !this.filtroGrado() || p.estudiantes.some(e => e.grado === this.filtroGrado());
      return coincideTexto && coincideEstado && coincideGrado;
    });
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina)));

  paginaDatos = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina;
    return this.filtrados().slice(inicio, inicio + this.porPagina);
  });

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private padreService: PadreService,
  ) {
    this.form = this.fb.group({
      nombreCompleto: ['', [Val.nombreCompleto()]],
      tipoDocumento: ['DNI', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: ['', [Val.fechaNacimiento(18, 100)]],
      telefono: ['', [Val.telefono(true)]],
      correo: ['', [Val.correo()]],
      direccion: ['', [Val.texto('la dirección', 5, 200)]],
      estado: ['Activo', Validators.required],
      // Cuenta de acceso: usuario APO + DNI (automático) y contraseña
      password: ['', [Val.password()]],
      confirmarPassword: [''],
    }, { validators: validadorDocumento() });
  }

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  /** Fecha de hoy (local, se actualiza cada día). */
  get hoy(): string { return hoyIso(); }

  /** Datos del tipo de documento elegido (maxlength, placeholder). */
  infoDoc() {
    return infoDocumento(this.form.get('tipoDocumento')?.value);
  }

  /** Mensaje de error del documento, solo cuando ya se escribió algo en el número. */
  errorDoc(): string | null {
    const c = this.form.get('dni');
    if (!c || !(c.touched || c.dirty)) return null;
    return this.form.errors?.['documento'] ?? null;
  }

  etiquetaDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).corto;
  }

  nombreDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).nombre;
  }

  /** Los hijos se vinculan en Académico (permiso ACADEMICO). */
  readonly puedeVincular = inject(AuthService).tienePermiso('ACADEMICO');

  /** Vista previa del usuario que tendrá el apoderado: APO + DNI. */
  usuarioPreview(): string {
    return usuarioConDni(PREFIJO_USUARIO.APODERADO, this.form.get('dni')?.value);
  }

  /** true si el formulario abierto es de un apoderado que ya tiene cuenta. */
  tieneCuenta(): boolean {
    return !!this.padreSeleccionado()?.usuario;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.padreService.listar().subscribe({
      next: (data) => { this.padres.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase();
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'bg-[#E7F3EA] text-[#1E7A3B]';
      case 'En proceso': return 'bg-[#FDF1DC] text-[#B08900]';
      case 'Inactivo': return 'bg-[#FBE7E9] text-[#A62639]';
      default: return 'bg-[#EFEAF3] text-[#4A1F52]';
    }
  }

  abrirCrear(): void {
    this.padreSeleccionado.set(null);
    this.error.set(null);
    this.form.reset({ nombreCompleto: '', tipoDocumento: 'DNI', dni: '', fechaNacimiento: '', telefono: '', correo: '', direccion: '', estado: 'Activo', password: '', confirmarPassword: '' });
    this.panelAbierto.set(true);
  }

  abrirEditar(p: PadreFamilia): void {
    this.padreSeleccionado.set(p);
    this.form.reset({
      nombreCompleto: p.nombreCompleto, tipoDocumento: p.tipoDocumento ?? 'DNI', dni: p.dni,
      fechaNacimiento: p.fechaNacimiento ?? '', telefono: p.telefono,
      correo: p.correo ?? '', direccion: p.direccion ?? '', estado: p.estado,
      password: '', confirmarPassword: '',
    });
    this.error.set(null);
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
    const v = this.form.value;
    if (v.password && v.password !== v.confirmarPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const payload = {
      nombreCompleto: limpiarTexto(v.nombreCompleto),
      tipoDocumento: v.tipoDocumento!,
      dni: limpiarDocumento(v.dni),
      fechaNacimiento: v.fechaNacimiento || null,
      telefono: soloDigitos(v.telefono),
      correo: (v.correo ?? '').trim() || null,
      direccion: limpiarTexto(v.direccion) || null,
      estado: v.estado!,
      // Al crear: vacío = su DNI. Al editar: vacío = no cambiar.
      password: v.password || null,
    };

    const seleccionado = this.padreSeleccionado();
    const peticion = seleccionado
      ? this.padreService.actualizar(seleccionado.id, payload)
      : this.padreService.crear(payload);

    peticion.subscribe({
      next: () => { this.guardando.set(false); this.toast.exito(seleccionado ? 'Datos del padre/apoderado actualizados.' : 'Registro del padre/apoderado creado correctamente.'); this.cerrarPanel(); this.cargar(); },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'Ocurrió un error al guardar el padre de familia.');
      },
    });
  }

  /** Botón "Desactivar/Activar cuenta" (tabla y panel Ver). Inactivo = no puede iniciar sesión. */
  async alternarEstado(x: PadreFamilia): Promise<void> {
    const activar = x.estado === 'Inactivo';
    if (!activar && !await this.confirmar.pedir(`¿Desactivar la cuenta de "${x.nombreCompleto}"? No podrá iniciar sesión hasta que la actives de nuevo.`)) return;
    this.error.set(null);
    this.padreService.cambiarEstado(x.id, activar).subscribe({
      next: () => { this.toast.exito(activar ? 'Cuenta activada.' : 'Cuenta desactivada.'); this.cargar(); },
      error: (err) => this.toast.error(err?.error?.mensaje ?? 'No se pudo cambiar el estado de la cuenta.'),
    });
  }

  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }
}

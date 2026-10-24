import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocenteService } from '../../../../core/services/docente.service';
import { Docente, ESPECIALIDADES, ESTADOS_DOCENTE } from '../../../../core/models/docente.model';
import { PREFIJO_USUARIO, usuarioConDni } from '../../../../core/models/usuario.model';
import { TIPOS_DOCUMENTO, infoDocumento, limpiarDocumento, validadorDocumento } from '../../../../core/models/documento.model';
import { hoyIso } from '../../../../core/utils/texto';
import { CampoPassword } from '../../../../shared/components/campo-password/campo-password';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';

import { ErrorCampo } from '../../../../shared/components/error-campo/error-campo';
import { FiltroEntrada } from '../../../../shared/components/error-campo/filtro-entrada';
import { Val, limpiarTexto, soloDigitos } from '../../../../core/utils/validadores';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';
type Pestana = 'general' | 'cuenta' | 'historial';

@Component({
  imports: [FotoUsuario, ErrorCampo, FiltroEntrada, CommonModule, ReactiveFormsModule, FormsModule, CampoPassword],
  selector: 'app-teachers',
  templateUrl: './teachers.html',
})
export class Teachers implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);

  especialidades = ESPECIALIDADES;
  estadosPosibles = ESTADOS_DOCENTE;

  docentes = signal<Docente[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = signal('');
  filtroEspecialidad = signal('');
  filtroEstado = signal('');

  paginaActual = signal(1);
  porPagina = 10;

  panelVerAbierto = signal(false);
  panelEditarAbierto = signal(false);
  docenteSeleccionado = signal<Docente | null>(null);
  pestanaActiva = signal<Pestana>('general');

  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.docentes().filter(d => {
      const coincideTexto = !texto ||
        d.nombreCompleto.toLowerCase().includes(texto) ||
        d.dni.toLowerCase().includes(texto) ||
        (d.usuario ?? '').toLowerCase().includes(texto);
      const coincideEspecialidad = !this.filtroEspecialidad() || d.especialidad === this.filtroEspecialidad();
      const coincideEstado = !this.filtroEstado() || d.estado === this.filtroEstado();
      return coincideTexto && coincideEspecialidad && coincideEstado;
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
    private docenteService: DocenteService,
  ) {
    this.form = this.fb.group({
      nombreCompleto: ['', [Val.nombreCompleto()]],
      tipoDocumento: ['DNI', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: ['', [Val.fechaNacimiento(18, 100)]],
      genero: [''],
      telefono: ['', [Val.telefono()]],
      correo: ['', [Val.correo()]],
      direccion: ['', [Val.texto('la dirección', 5, 200)]],
      especialidad: ['', [Validators.required, Val.texto('la especialidad', 3, 100, true)]],
      tituloProfesional: ['', [Val.texto('el título profesional', 3, 150)]],
      fechaIngreso: ['', [Val.noFutura('la fecha de ingreso')]],
      estado: ['Activo', Validators.required],
      // Cuenta de acceso: usuario DOC + DNI (automático) y contraseña
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

  /** Vista previa del usuario que tendrá el docente: DOC + DNI. */
  usuarioPreview(): string {
    return usuarioConDni(PREFIJO_USUARIO.DOCENTE, this.form.get('dni')?.value);
  }

  /** true si el formulario abierto es de un docente que ya tiene cuenta. */
  tieneCuenta(): boolean {
    return !!this.docenteSeleccionado()?.usuario;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.docenteService.listar().subscribe({
      next: (data) => { this.docentes.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase();
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'bg-[#E7F3EA] text-[#1E7A3B]';
      case 'De licencia': return 'bg-[#FDF1DC] text-[#B08900]';
      case 'Inactivo': return 'bg-[#FBE7E9] text-[#A62639]';
      default: return 'bg-[#EFEAF3] text-[#4A1F52]';
    }
  }

  abrirCrear(): void {
    this.docenteSeleccionado.set(null);
    this.error.set(null);
    this.form.reset({
      nombreCompleto: '', tipoDocumento: 'DNI', dni: '', fechaNacimiento: '', genero: '', telefono: '',
      correo: '', direccion: '', especialidad: '', tituloProfesional: '',
      fechaIngreso: this.hoy, estado: 'Activo', password: '', confirmarPassword: '',
    });
    this.panelEditarAbierto.set(true);
  }

  abrirVer(d: Docente): void {
    this.docenteSeleccionado.set(d);
    this.pestanaActiva.set('general');
    this.panelVerAbierto.set(true);
  }

  abrirEditarDesdeVista(): void {
    const d = this.docenteSeleccionado();
    if (!d) return;
    this.error.set(null);
    this.form.reset({
      nombreCompleto: d.nombreCompleto, tipoDocumento: d.tipoDocumento ?? 'DNI', dni: d.dni, fechaNacimiento: d.fechaNacimiento ?? '',
      genero: d.genero ?? '', telefono: d.telefono ?? '', correo: d.correo ?? '',
      direccion: d.direccion ?? '', especialidad: d.especialidad ?? '',
      tituloProfesional: d.tituloProfesional ?? '', fechaIngreso: d.fechaIngreso ?? '',
      estado: d.estado, password: '', confirmarPassword: '',
    });
    this.panelVerAbierto.set(false);
    this.panelEditarAbierto.set(true);
  }

  cerrarPaneles(): void {
    this.panelVerAbierto.set(false);
    this.panelEditarAbierto.set(false);
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
      genero: v.genero || null,
      telefono: soloDigitos(v.telefono) || null,
      correo: (v.correo ?? '').trim() || null,
      direccion: limpiarTexto(v.direccion) || null,
      especialidad: v.especialidad!,
      tituloProfesional: v.tituloProfesional || null,
      fechaIngreso: v.fechaIngreso || null,
      estado: v.estado!,
      // Al crear: vacío = su DNI. Al editar: vacío = no cambiar.
      password: v.password || null,
    };

    const seleccionado = this.docenteSeleccionado();
    const peticion = seleccionado
      ? this.docenteService.actualizar(seleccionado.id, payload)
      : this.docenteService.crear(payload);

    peticion.subscribe({
      next: () => { this.guardando.set(false); this.toast.exito(seleccionado ? 'Datos del docente actualizados.' : 'Registro del docente creado correctamente.'); this.cerrarPaneles(); this.cargar(); },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'Ocurrió un error al guardar el docente.');
      },
    });
  }

  /** Botón "Desactivar/Activar cuenta" (tabla y panel Ver). Inactivo = no puede iniciar sesión. */
  async alternarEstado(x: Docente): Promise<void> {
    const activar = x.estado === 'Inactivo';
    if (!activar && !await this.confirmar.pedir(`¿Desactivar la cuenta de "${x.nombreCompleto}"? No podrá iniciar sesión hasta que la actives de nuevo.`)) return;
    this.error.set(null);
    this.docenteService.cambiarEstado(x.id, activar).subscribe({
      next: () => { this.toast.exito(activar ? 'Cuenta activada.' : 'Cuenta desactivada.'); this.cerrarPaneles(); this.cargar(); },
      error: (err) => this.toast.error(err?.error?.mensaje ?? 'No se pudo cambiar el estado de la cuenta.'),
    });
  }

  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }
}

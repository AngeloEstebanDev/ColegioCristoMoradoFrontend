import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormGroup
} from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { PerfilService } from '../../../core/services/perfil.service';
import { Perfil as PerfilModel, PerfilUpdateRequest } from '../../../core/models/perfil.model';
import { etiquetaRol } from '../../../core/models/usuario.model';
import { PERMISOS } from '../../../core/models/permiso.model';
import { infoDocumento } from '../../../core/models/documento.model';
import { GRUPOS_AVATARES, rutaAvatar } from '../../../core/models/avatares';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';

import { ErrorCampo } from '../../../shared/components/error-campo/error-campo';
import { FiltroEntrada } from '../../../shared/components/error-campo/filtro-entrada';
import { Val, limpiarTexto, soloDigitos } from '../../../core/utils/validadores';
import { FotoService } from '../../../core/services/foto.service';
/**
 * Vista "Mi perfil". La usan los 4 roles (admin/docente/alumno/padre):
 * se enruta el mismo componente desde app.routes.ts en cada sección,
 * y aquí siempre se trabaja con el usuario logeado (AuthService).
 */
@Component({
  imports: [ErrorCampo, FiltroEntrada, CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-perfil',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private toast = inject(ToastService);
  private confirmar = inject(ConfirmService);
  private fotos = inject(FotoService);

  perfil = signal<PerfilModel | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);
  guardadoOk = signal(false);
  editando = signal(false);

  etiquetaRol = etiquetaRol;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private perfilService: PerfilService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Val.nombreCompleto()]],
      // Directiva: nombres y apellidos por separado
      nombres: ['', [Val.letras('tus nombres', 100, true)]],
      apellidoPaterno: ['', [Val.letras('el apellido paterno', 60, true)]],
      apellidoMaterno: ['', [Val.letras('el apellido materno', 60)]],
      telefono: ['', [Val.telefono()]],
      direccion: ['', [Val.texto('la dirección', 5, 200)]],
      fechaNacimiento: ['', [Val.fechaNacimiento(18, 100)]],
      genero: [''],
      correoContacto: ['', [Val.correo()]],
      especialidad: ['', [Val.texto('la especialidad', 3, 100)]],
      tituloProfesional: ['', [Val.texto('el título profesional', 3, 150)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const usuario = this.authService.obtenerUsuario();

    if (!usuario) return;

    this.cargando.set(true);

    this.perfilService.obtener(usuario.id).subscribe({
      next: (p) => {
        this.perfil.set(p);

        this.llenarFormulario(p);

        this.cargando.set(false);
      },

      error: () => {
        this.error.set('No se pudo cargar tu perfil.');
        this.cargando.set(false);
      },
    });
  }

  private llenarFormulario(p: PerfilModel): void {
    this.form.reset({
      nombre: p.nombre,
      nombres: p.personal?.nombres ?? '',
      apellidoPaterno: p.personal?.apellidoPaterno ?? '',
      apellidoMaterno: p.personal?.apellidoMaterno ?? '',
      telefono: p.telefono ?? '',
      direccion: p.direccion ?? '',
      fechaNacimiento: p.docente?.fechaNacimiento ?? p.padre?.fechaNacimiento ?? p.personal?.fechaNacimiento ?? '',
      genero: p.docente?.genero ?? '',
      correoContacto: p.docente?.correo ?? p.padre?.correo ?? p.personal?.correo ?? '',
      especialidad: p.docente?.especialidad ?? '',
      tituloProfesional: p.docente?.tituloProfesional ?? '',
    });
  }

  /** Administrador (cuenta sin registro de docente, padre o directiva). */
  esCuentaSola(p: PerfilModel): boolean {
    return !p.docente && !p.padre && !p.personal && !p.estudiante;
  }

  // ------------------------------------------------------------------
  // Foto de perfil
  // ------------------------------------------------------------------

  subiendoFoto = signal(false);
  selectorFoto = signal(false);
  gruposAvatares = GRUPOS_AVATARES;
  rutaAvatar = rutaAvatar;

  abrirSelectorFoto(): void {
    this.error.set(null);
    this.selectorFoto.set(true);
  }

  cerrarSelectorFoto(): void {
    if (!this.subiendoFoto()) this.selectorFoto.set(false);
  }

  elegirAvatar(id: string): void {
    this.guardarFoto({ foto: rutaAvatar(id) });
  }

  elegirFoto(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    const p = this.perfil();
    if (!archivo || !p) return;
    if (!archivo.type.startsWith('image/')) { this.error.set('La foto debe ser una imagen (JPG o PNG).'); return; }
    if (archivo.size > 2 * 1024 * 1024) { this.error.set('La foto no puede pesar más de 2 MB.'); return; }
    const lector = new FileReader();
    lector.onload = () => this.guardarFoto({ foto: lector.result as string });
    lector.readAsDataURL(archivo);
  }

  async quitarFoto(): Promise<void> {
    if (!await this.confirmar.pedir('¿Quitar tu foto de perfil?')) return;
    this.selectorFoto.set(false);
    this.guardarFoto({ quitarFoto: true });
  }

  private guardarFoto(datos: { foto?: string; quitarFoto?: boolean }): void {
    const p = this.perfil();
    if (!p) return;
    this.subiendoFoto.set(true);
    this.error.set(null);
    this.perfilService.actualizar(p.usuarioId, datos).subscribe({
      next: (a) => { this.perfil.set(a); this.fotos.cargar(true); this.subiendoFoto.set(false); this.selectorFoto.set(false); this.toast.exito(datos.quitarFoto ? 'Foto de perfil eliminada.' : 'Foto de perfil actualizada.'); },
      error: (err) => {
        this.subiendoFoto.set(false);
        this.selectorFoto.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo guardar la foto.');
      },
    });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase();
  }

  // ------------------------------------------------------------------
  // Gmail: vincular / verificar con código
  // ------------------------------------------------------------------

  gmailAbierto = signal(false);
  gmailPaso = signal<'correo' | 'codigo'>('correo');
  gmailInput = signal('');
  gmailCodigo = signal('');
  gmailEnmascarado = signal('');
  gmailError = signal<string | null>(null);
  gmailOk = signal(false);
  gmailCargando = signal(false);
  segundosReenvio = signal(0);
  private temporizador?: ReturnType<typeof setInterval>;

  abrirGmail(): void {
    const p = this.perfil();
    this.gmailInput.set(p?.correo && !p.correoVerificado ? p.correo : '');
    this.gmailCodigo.set('');
    this.gmailPaso.set('correo');
    this.gmailError.set(null);
    this.gmailOk.set(false);
    this.gmailAbierto.set(true);
  }

  cancelarGmail(): void {
    this.gmailAbierto.set(false);
    this.detenerTemporizador();
  }

  enviarCodigoGmail(): void {
    const p = this.perfil();
    const correo = this.gmailInput().trim();
    if (!p) return;
    if (!/^[^\s@]+@gmail\.com$/i.test(correo)) {
      this.gmailError.set('Escribe un Gmail válido (termina en @gmail.com).');
      return;
    }
    this.gmailError.set(null);
    this.gmailCargando.set(true);
    this.perfilService.enviarCodigoCorreo(p.usuarioId, correo).subscribe({
      next: (r) => {
        this.gmailCargando.set(false);
        this.gmailEnmascarado.set(r.correoEnmascarado);
        this.gmailPaso.set('codigo');
        this.iniciarTemporizador(r.segundosParaReenviar);
      },
      error: (err) => {
        this.gmailCargando.set(false);
        this.gmailError.set(err?.error?.mensaje ?? 'No se pudo enviar el código.');
      },
    });
  }

  verificarGmail(): void {
    const p = this.perfil();
    if (!p) return;
    const codigo = this.gmailCodigo().trim();
    if (!/^\d{6}$/.test(codigo)) {
      this.gmailError.set('Escribe el código de 6 dígitos.');
      return;
    }
    this.gmailError.set(null);
    this.gmailCargando.set(true);
    this.perfilService.verificarCorreo(p.usuarioId, codigo).subscribe({
      next: (actualizado) => {
        this.gmailCargando.set(false);
        this.perfil.set(actualizado);
        this.gmailAbierto.set(false);
        this.toast.exito('¡Listo! Tu Gmail quedó verificado.');
        this.detenerTemporizador();
        const usuario = this.authService.obtenerUsuario();
        if (usuario) {
          this.authService.guardarSesion({ ...usuario, correo: actualizado.correo, correoVerificado: true });
        }
      },
      error: (err) => {
        this.gmailCargando.set(false);
        this.gmailError.set(err?.error?.mensaje ?? 'No se pudo verificar el código.');
      },
    });
  }

  private iniciarTemporizador(segundos: number): void {
    this.detenerTemporizador();
    this.segundosReenvio.set(segundos);
    this.temporizador = setInterval(() => {
      const s = this.segundosReenvio() - 1;
      this.segundosReenvio.set(Math.max(0, s));
      if (s <= 0) this.detenerTemporizador();
    }, 1000);
  }

  private detenerTemporizador(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = undefined;
  }

  /** Nombres legibles de los permisos del panel. */
  permisosInfo(permisos: string[] | null | undefined): string[] {
    return (permisos ?? []).map(v => PERMISOS.find(x => x.valor === v)?.titulo ?? v);
  }

  /** Edad a partir de la fecha de nacimiento (AAAA-MM-DD). */
  nombreDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).nombre;
  }

  edad(fecha: string | null | undefined): number | null {
    if (!fecha) return null;
    const n = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    let e = hoy.getFullYear() - n.getFullYear();
    const m = hoy.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
    return e;
  }

  /** "12 de abril de 2014" */
  fecha(f: string | null | undefined): string {
    if (!f) return '—';
    return new Date(f.length === 10 ? f + 'T00:00:00' : f)
      .toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  activarEdicion(): void {
    const p = this.perfil();
    if (!p?.puedeEditar) return;
    this.llenarFormulario(p);
    // Directiva: nombres + apellidos. Resto: nombre completo.
    for (const c of ['nombres', 'apellidoPaterno', 'apellidoMaterno']) {
      if (p.personal) this.form.get(c)?.enable(); else this.form.get(c)?.disable();
    }
    if (p.personal) this.form.get('nombre')?.disable(); else this.form.get('nombre')?.enable();
    // Docente y padre: nombre y apellido. Administrador: solo letras. Padre: teléfono obligatorio.
    this.form.get('nombre')?.setValidators(p.docente || p.padre ? [Val.nombreCompleto()] : [Val.letras('tu nombre', 100, true)]);
    this.form.get('telefono')?.setValidators([Val.telefono(!!p.padre)]);
    this.form.get('nombre')?.updateValueAndValidity();
    this.form.get('telefono')?.updateValueAndValidity();
    this.guardadoOk.set(false);
    this.editando.set(true);
  }

  cancelarEdicion(): void {
    this.editando.set(false);
    this.cargar();
  }

  guardar(): void {
    const p = this.perfil();

    if (!p || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const v = this.form.value;

    const datos: PerfilUpdateRequest = {
      telefono: soloDigitos(v.telefono),
      direccion: limpiarTexto(v.direccion),
    };
    if (p.personal) {
      datos.nombres = v.nombres;
      datos.apellidoPaterno = v.apellidoPaterno;
      datos.apellidoMaterno = v.apellidoMaterno ?? '';
    } else {
      datos.nombre = limpiarTexto(v.nombre);
    }
    if (!this.esCuentaSola(p)) {
      datos.fechaNacimiento = v.fechaNacimiento || null;
      datos.correoContacto = (v.correoContacto ?? '').trim();
    }
    if (p.docente) {
      datos.genero = v.genero ?? '';
      datos.especialidad = (v.especialidad ?? '').trim();
      datos.tituloProfesional = (v.tituloProfesional ?? '').trim();
    }

    this.perfilService.actualizar(p.usuarioId, datos).subscribe({
      next: (actualizado) => {
        this.perfil.set(actualizado);

        this.guardando.set(false);
        this.editando.set(false);
        this.toast.exito('Tus datos se guardaron correctamente.');

        // Mantiene sincronizado el navbar
        // (nombre/correo mostrados arriba).
        const usuario = this.authService.obtenerUsuario();

        if (usuario) {
          this.authService.guardarSesion({
            ...usuario,
            nombre: actualizado.nombre,
          });
        }
      },

      error: (err) => {
        this.guardando.set(false);

        this.error.set(
          err?.error?.mensaje ??
          'No se pudo guardar tu perfil.'
        );
      },
    });
  }
}

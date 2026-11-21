import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { PerfilService } from '../../../core/services/perfil.service';
import { CampoPassword } from '../../../shared/components/campo-password/campo-password';
import { ToastService } from '../../../core/services/toast.service';

import { ErrorCampo } from '../../../shared/components/error-campo/error-campo';
import { FiltroEntrada } from '../../../shared/components/error-campo/filtro-entrada';
import { Val } from '../../../core/utils/validadores';
import { mensajeHttp } from '../../../core/utils/error-http';

/** Función coincideConNueva: coincide con nueva. */
export function coincideConNueva(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const confirmar = control.get('confirmarPassword')?.value;

  return nueva && confirmar && nueva !== confirmar
    ? { noCoincide: true }
    : null;
}

/**
 * Vista "Configuración": cambiar la contraseña. Por seguridad pide un
 * código enviado al Gmail verificado del usuario. La usan los 4 roles.
 */
@Component({
  imports: [ErrorCampo, FiltroEntrada, CommonModule, ReactiveFormsModule, RouterLink, CampoPassword],
  selector: 'app-configuracion',
  templateUrl: './configuracion.html',
})
export class Configuracion implements OnInit, OnDestroy {
  /** Servicio ToastService (inyectado por Angular). */
  private toast = inject(ToastService);

  /** Servicio FormBuilder (inyectado por Angular). */
  private fb = inject(FormBuilder);
  /** Servicio AuthService (inyectado por Angular). */
  private authService = inject(AuthService);
  /** Servicio PerfilService (inyectado por Angular). */
  private perfilService = inject(PerfilService);

  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): guardando. */
  guardando = signal(false);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): éxito. */
  exito = signal(false);

  // Gmail
  correo = signal<string | null>(null);
  /** Estado (signal): correo verificado. */
  correoVerificado = signal(false);
  rutaPerfil: string[] = ['/home', this.rolPath(), 'perfil'];

  // Código
  enviandoCodigo = signal(false);
  /** Estado (signal): código enviado a. */
  codigoEnviadoA = signal<string | null>(null);
  /** Estado (signal): segundos reenvio. */
  segundosReenvio = signal(0);
  private temporizador?: ReturnType<typeof setInterval>;

  form: FormGroup = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Val.password(true)]],
    confirmarPassword: ['', Validators.required],
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  }, {
    validators: coincideConNueva
  });

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales. Pide los datos al backend con perfilService.obtener() y actualiza la pantalla
   * cuando llega la respuesta.
   */
  ngOnInit(): void {
    const usuario = this.authService.obtenerUsuario();
    if (!usuario) return;
    this.perfilService.obtener(usuario.id).subscribe({
      next: (p) => {
        this.correo.set(p.correo);
        this.correoVerificado.set(!!p.correo && p.correoVerificado);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu cuenta.');
        this.cargando.set(false);
      },
    });
  }

  /**
   * Se ejecuta al salir de la pantalla (cuando Angular destruye el componente): limpia temporizadores
   * y suscripciones.
   */
  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  /**
   * Envía código. Pide los datos al backend con perfilService.enviarCodigoPassword() y actualiza la
   * pantalla cuando llega la respuesta.
   */
  enviarCodigo(): void {
    const usuario = this.authService.obtenerUsuario();
    if (!usuario) return;
    this.error.set(null);
    this.enviandoCodigo.set(true);
    this.perfilService.enviarCodigoPassword(usuario.id).subscribe({
      next: (r) => {
        this.enviandoCodigo.set(false);
        this.codigoEnviadoA.set(r.correoEnmascarado);
        this.iniciarTemporizador(r.segundosParaReenviar);
      },
      error: (err) => {
        this.enviandoCodigo.set(false);
        this.error.set(mensajeHttp(err, 'No se pudo enviar el código.'));
      },
    });
  }

  /** Cambia contraseña. Muestra un aviso (toast) con el resultado. */
  cambiarPassword(): void {
    this.error.set(null);
    this.exito.set(false);

    if (!this.codigoEnviadoA()) {
      this.error.set('Primero pide el código de verificación a tu Gmail.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('noCoincide')) {
        this.error.set('La confirmación no coincide con la nueva contraseña.');
      } else if (this.form.get('codigo')?.invalid) {
        this.error.set('Escribe el código de 6 dígitos que te llegó al Gmail.');
      } else if (this.form.get('passwordNueva')?.hasError('minlength')) {
        this.error.set('La nueva contraseña debe tener al menos 4 caracteres.');
      } else {
        this.error.set('Completa todos los campos.');
      }
      return;
    }

    const usuario = this.authService.obtenerUsuario();
    if (!usuario) return;

    this.guardando.set(true);
    const v = this.form.value;
    this.perfilService.cambiarPassword(usuario.id, {
      passwordActual: v.passwordActual,
      passwordNueva: v.passwordNueva,
      codigo: String(v.codigo).trim(),
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Tu contraseña se actualizó correctamente.');
        this.form.reset();
        this.codigoEnviadoA.set(null);
        this.detenerTemporizador();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeHttp(err, 'No se pudo cambiar la contraseña.'));
      },
    });
  }

  /** Inicia temporizador. */
  private iniciarTemporizador(segundos: number): void {
    this.detenerTemporizador();
    this.segundosReenvio.set(segundos);
    this.temporizador = setInterval(() => {
      const s = this.segundosReenvio() - 1;
      this.segundosReenvio.set(Math.max(0, s));
      if (s <= 0) this.detenerTemporizador();
    }, 1000);
  }

  /** Realiza la acción «detener temporizador» de esta pantalla. */
  private detenerTemporizador(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = undefined;
  }

  /** Segmento /home/{rol}/... del usuario logeado. */
  private rolPath(): string {
    const rol = (this.authService.obtenerRol() ?? '').toLowerCase();
    if (['docente', 'profesor'].includes(rol)) return 'docente';
    if (['alumno', 'estudiante'].includes(rol)) return 'alumno';
    if (['padre', 'familiar', 'apoderado'].includes(rol)) return 'padre';
    return 'admin';
  }
}

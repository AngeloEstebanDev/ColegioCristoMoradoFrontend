import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CampoPassword } from '../../shared/components/campo-password/campo-password';
import { ToastService } from '../../core/services/toast.service';

import { FiltroEntrada } from '../../shared/components/error-campo/filtro-entrada';
import { Val, revisar } from '../../core/utils/validadores';
import { SOPORTE_TELEFONO, enlaceSoporte } from '../../core/utils/soporte';
type Modo = 'login' | 'recuperar';

@Component({
  imports: [FiltroEntrada, CommonModule, FormsModule, CampoPassword],
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private toast = inject(ToastService);

  private authService = inject(AuthService);
  private router = inject(Router);

  // La app no usa zone.js: todo lo que cambia tras una respuesta del
  // servidor es un signal para que la pantalla se actualice.
  modo = signal<Modo>('login');

  // ---- Login ----
  usuario = signal('');
  password = signal('');
  guardarPassword = signal(false);
  cargando = signal(false);
  errorUsuario = signal<string | null>(null);
  errorPassword = signal<string | null>(null);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  // ---- ¿Olvidaste tu contraseña? ----
  pasoRecuperar = signal<1 | 2>(1);
  recUsuario = signal('');
  recCodigo = signal('');
  recNueva = signal('');
  recConfirmar = signal('');
  recCorreo = signal('');
  recError = signal<string | null>(null);

  /** Soporte por WhatsApp (el mensaje incluye el usuario escrito, si hay). */
  readonly telefonoSoporte = SOPORTE_TELEFONO;
  enlaceSoporte(): string {
    const u = (this.usuario() || this.recUsuario() || '').trim();
    return enlaceSoporte('Hola, necesito ayuda para acceder al Portal de la I.E. 2092 Cristo Morado.' + (u ? ` Mi usuario es ${u}.` : ''));
  }
  recCargando = signal(false);
  segundosReenvio = signal(0);
  private temporizador?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // "Guardar contraseña": se recuerda el usuario en este equipo y el
    // navegador (Chrome/Edge) rellena la contraseña que guardó.
    const recordado = this.authService.usuarioRecordado();
    if (recordado) {
      this.usuario.set(recordado);
      this.guardarPassword.set(true);
      this.leerCredencialDelNavegador(recordado);
    }
  }

  onSubmit(): void {
    this.errorUsuario.set(null);
    this.errorPassword.set(null);
    this.error.set(null);
    this.aviso.set(null);

    const usuario = this.usuario().trim();
    if (!usuario) { this.errorUsuario.set('Ingresa tu usuario.'); return; }
    if (!this.password()) { this.errorPassword.set('Ingresa tu contraseña.'); return; }

    this.cargando.set(true);
    this.authService.login({ usuario, password: this.password() }).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        if (this.guardarPassword()) {
          this.authService.recordarUsuario(respuesta.usuario);
          this.guardarCredencialEnNavegador(respuesta.usuario, this.password(), respuesta.nombre);
        } else {
          this.authService.recordarUsuario(null);
        }
        this.router.navigate(this.rutaSegunRol(respuesta.rol));
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje: string = err?.error?.mensaje ?? '';
        const campo: string | undefined = err?.error?.campo;
        if (err?.status === 0) {
          this.error.set('No se pudo conectar con el servidor.');
        } else if (campo === 'usuario') {
          this.errorUsuario.set(mensaje || 'El usuario no existe.');
        } else if (campo === 'password') {
          this.errorPassword.set(mensaje || 'Contraseña incorrecta.');
        } else {
          this.error.set(mensaje || 'No se pudo iniciar sesión.');
        }
      },
    });
  }

  // ---------------- ¿Olvidaste tu contraseña? ----------------

  abrirRecuperar(ev?: Event): void {
    ev?.preventDefault();
    this.modo.set('recuperar');
    this.pasoRecuperar.set(1);
    this.recUsuario.set(this.usuario().trim());
    this.recCodigo.set('');
    this.recNueva.set('');
    this.recConfirmar.set('');
    this.recError.set(null);
  }

  volverAlLogin(): void {
    this.modo.set('login');
    this.detenerTemporizador();
  }

  enviarCodigoRecuperacion(): void {
    const usuario = this.recUsuario().trim();
    if (!usuario) { this.recError.set('Escribe tu usuario.'); return; }
    this.recError.set(null);
    this.recCargando.set(true);
    this.authService.solicitarRecuperacion(usuario).subscribe({
      next: (r) => {
        this.recCargando.set(false);
        this.recCorreo.set(r.correoEnmascarado);
        this.pasoRecuperar.set(2);
        this.iniciarTemporizador(r.segundosParaReenviar);
      },
      error: (err) => {
        this.recCargando.set(false);
        this.recError.set(err?.error?.mensaje ?? 'No se pudo enviar el código.');
      },
    });
  }

  restablecer(): void {
    this.recError.set(null);
    if (!/^\d{6}$/.test(this.recCodigo().trim())) { this.recError.set('Escribe el código de 6 dígitos.'); return; }
    const errClave = revisar(this.recNueva(), Val.password(true));
    if (errClave) { this.recError.set(errClave); return; }
    if (this.recNueva() !== this.recConfirmar()) { this.recError.set('Las contraseñas no coinciden.'); return; }

    this.recCargando.set(true);
    this.authService.restablecerPassword(this.recUsuario().trim(), this.recCodigo().trim(), this.recNueva()).subscribe({
      next: () => {
        this.recCargando.set(false);
        this.usuario.set(this.recUsuario().trim());
        this.password.set('');
        this.volverAlLogin();
        this.toast.exito('Tu contraseña se cambió. Ya puedes ingresar con la nueva.');
      },
      error: (err) => {
        this.recCargando.set(false);
        this.recError.set(err?.error?.mensaje ?? 'No se pudo cambiar la contraseña.');
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

  // ---------------- Gestor de contraseñas del navegador ----------------

  /** Pide al navegador que guarde usuario + contraseña (Chrome/Edge). */
  private guardarCredencialEnNavegador(usuario: string, password: string, nombre: string): void {
    const w = window as any;
    if (!w.PasswordCredential || !navigator.credentials) return;
    try {
      const cred = new w.PasswordCredential({ id: usuario, password, name: nombre });
      navigator.credentials.store(cred).catch(() => {});
    } catch { /* el navegador no lo permite */ }
  }

  /** Si el navegador tiene guardada la contraseña de ese usuario, la rellena. */
  private leerCredencialDelNavegador(usuario: string): void {
    const w = window as any;
    if (!w.PasswordCredential || !navigator.credentials) return;
    (navigator.credentials as any).get({ password: true, mediation: 'optional' })
      .then((cred: any) => {
        if (cred && cred.type === 'password' && cred.id?.toLowerCase() === usuario.toLowerCase() && !this.password()) {
          this.password.set(cred.password ?? '');
        }
      })
      .catch(() => {});
  }

  /**
   * Traduce el rol devuelto por el backend (columna `usuarios.rol`) a la
   * ruta de inicio de su sección. Si el rol no coincide con ninguno,
   * cae en /home (que hoy redirige a admin/inicio) como último recurso.
   */
  private rutaSegunRol(rol: string): string[] {
    const r = (rol ?? '').toLowerCase();

    if (r === 'administrador' || r === 'admin') return ['/home', 'admin', 'inicio'];
    // La Directiva usa el panel del administrador (con los permisos que le asigne).
    if (r === 'directivo' || r === 'directiva' || r === 'director') return ['/home', 'admin', 'inicio'];
    if (r === 'docente' || r === 'profesor') return ['/home', 'docente', 'inicio'];
    if (r === 'alumno' || r === 'estudiante') return ['/home', 'alumno', 'inicio'];
    if (r === 'padre' || r === 'familiar' || r === 'apoderado') return ['/home', 'padre', 'inicio'];

    return ['/home'];
  }
}

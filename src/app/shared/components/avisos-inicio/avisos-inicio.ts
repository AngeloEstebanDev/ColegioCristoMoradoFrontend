import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../services/auth';
import { ComunicadoService } from '../../../core/services/comunicado.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { fechaLarga, haceCuanto } from '../../../core/utils/texto';

/** Novedad que se muestra en el modal: un anuncio importante o un aviso del colegio. */
interface Novedad {
  clave: string;
  tipo: 'ANUNCIO' | 'AVISO';
  id: number;
  titulo: string;
  contenido: string;
  imagen: string | null;
  autor: string;
  fecha: string;
}

/**
 * Modal grande que aparece al entrar a la cuenta (cualquier rol) con lo que el usuario aún no leyó:
 *  - Anuncios importantes de Comunicados.
 *  - Avisos del colegio: cambios de horario, nuevas actividades y materiales, notas, asistencia, citas...
 * Al cerrarlo (o al pasar por cada novedad) quedan marcados como leídos.
 */
@Component({
  selector: 'app-avisos-inicio',
  standalone: true,
  templateUrl: './avisos-inicio.html',
})
export class AvisosInicio {
  private auth = inject(AuthService);
  private comunicados = inject(ComunicadoService);
  private mensajes = inject(MensajeService);
  private notificaciones = inject(NotificacionService);
  private router = inject(Router);

  readonly haceCuanto = haceCuanto;
  readonly fechaLarga = fechaLarga;

  novedades = signal<Novedad[]>([]);
  indice = signal(0);
  abierto = signal(false);
  actual = computed(() => this.novedades()[this.indice()] ?? null);
  private vistas = new Set<string>();

  constructor() {
    const u = this.auth.obtenerUsuario();
    if (!u) return;
    forkJoin({
      comunicados: this.comunicados.listar(u.id).pipe(catchError(() => of([]))),
      avisos: this.mensajes.avisosPendientes(u.id).pipe(catchError(() => of([]))),
    }).subscribe(({ comunicados, avisos }) => {
      const lista: Novedad[] = [
        ...comunicados.filter(c => c.anuncio && !c.leido).map(c => ({
          clave: 'c' + c.id, tipo: 'ANUNCIO' as const, id: c.id, titulo: c.titulo, contenido: c.contenido,
          imagen: c.imagen, autor: c.autorNombre ?? 'Colegio', fecha: c.fechaCreacion,
        })),
        ...avisos.map(m => ({
          clave: 'm' + m.id, tipo: 'AVISO' as const, id: m.id, titulo: m.asunto || 'Aviso del colegio', contenido: m.contenido,
          imagen: null, autor: 'Avisos del colegio', fecha: m.fechaEnvio,
        })),
      ].sort((a, b) => (a.tipo === b.tipo ? b.fecha.localeCompare(a.fecha) : a.tipo === 'ANUNCIO' ? -1 : 1));
      if (!lista.length) return;
      this.novedades.set(lista);
      this.indice.set(0);
      this.vistas.add(lista[0].clave);
      this.abierto.set(true);
    });
  }

  ir(i: number): void {
    const n = this.novedades();
    if (i < 0 || i >= n.length) return;
    this.indice.set(i);
    this.vistas.add(n[i].clave);
  }

  /** Cierra el modal y marca como leídas las novedades que el usuario vio. */
  cerrar(todas = false): void {
    const u = this.auth.obtenerUsuario();
    const leidas = this.novedades().filter(n => todas || this.vistas.has(n.clave));
    this.abierto.set(false);
    if (!u || !leidas.length) return;
    const avisos = leidas.filter(n => n.tipo === 'AVISO').map(n => n.id);
    const anuncios = leidas.filter(n => n.tipo === 'ANUNCIO');
    const peticiones = [
      ...(avisos.length ? [this.mensajes.marcarAvisosLeidos(avisos, u.id).pipe(catchError(() => of(null)))] : []),
      ...anuncios.map(a => this.comunicados.marcarLeido(a.id, u.id).pipe(catchError(() => of(null)))),
    ];
    if (peticiones.length) forkJoin(peticiones).subscribe(() => this.notificaciones.refrescar());
  }

  /** Abre Comunicados (pestaña Mensajes para los avisos). */
  verEnComunicados(): void {
    const n = this.actual();
    const rol = (this.auth.obtenerUsuario()?.rol ?? '').toUpperCase();
    const base = rol === 'DOCENTE' ? '/home/docente' : rol === 'ALUMNO' ? '/home/alumno' : rol === 'PADRE' ? '/home/padre' : '/home/admin';
    this.cerrar(true);
    this.router.navigate([base + '/comunicados'], n?.tipo === 'AVISO' ? { queryParams: { tab: 'mensajes' } } : {});
  }

  @HostListener('document:keydown', ['$event'])
  teclado(e: KeyboardEvent): void {
    if (!this.abierto()) return;
    if (e.key === 'Escape') this.cerrar();
    else if (e.key === 'ArrowRight') this.ir(this.indice() + 1);
    else if (e.key === 'ArrowLeft') this.ir(this.indice() - 1);
  }
}

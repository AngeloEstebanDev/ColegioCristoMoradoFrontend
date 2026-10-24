import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, catchError } from 'rxjs';
import { Hijo, HijosService } from '../../../../core/services/hijos.service';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { AulaService } from '../../../../core/services/aula.service';
import { MiHorario } from '../../../../core/models/mi-horario.model';
import { Actividad } from '../../../../core/models/aula.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { iniciales } from '../../../../core/utils/texto';
import { HorarioSemana } from '../../../../shared/academico/horario-semana';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

/** Resumen de un hijo: su horario y sus actividades (se carga al abrir su tarjeta). */
interface Detalle { cargando: boolean; error: string | null; horario: MiHorario | null; pendientes: number; }

/**
 * Dashboard del padre: bienvenida, cuántos hijos tiene registrados y, por cada hijo
 * (en acordeón), sus cursos, actividades pendientes, sección y horario de la semana.
 */
@Component({
  imports: [FotoUsuario, CommonModule, HorarioSemana],
  selector: 'app-padre-dashboard',
  templateUrl: './dashboard.html',
})
export class PadreDashboard implements OnInit {
  private hijosService = inject(HijosService);
  private miHorario = inject(MiHorarioService);
  private aula = inject(AulaService);

  readonly iniciales = iniciales;

  hijos = signal<Hijo[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  abiertos = signal<Set<number>>(new Set());
  detalles = signal<Record<number, Detalle>>({});

  ngOnInit(): void {
    this.hijosService.listar().subscribe({
      next: (h) => {
        this.hijos.set(h);
        this.cargando.set(false);
        if (h.length) this.alternar(h[0].id);   // el primero se muestra abierto
      },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo cargar a tus hijos.'); },
    });
  }

  abierto(id: number): boolean { return this.abiertos().has(id); }

  alternar(id: number): void {
    const s = new Set(this.abiertos());
    if (s.has(id)) s.delete(id); else { s.add(id); this.cargar(id); }
    this.abiertos.set(s);
  }

  detalle(id: number): Detalle | undefined { return this.detalles()[id]; }

  private cargar(id: number): void {
    if (this.detalles()[id] && !this.detalles()[id].error) return;   // ya cargado
    this.detalles.update(d => ({ ...d, [id]: { cargando: true, error: null, horario: null, pendientes: 0 } }));
    forkJoin({
      h: this.miHorario.hijo(id).pipe(catchError(() => of(null))),
      a: this.aula.actividadesHijo(id).pipe(catchError(() => of(null as Actividad[] | null))),
    }).subscribe(r => {
      this.detalles.update(d => ({
        ...d,
        [id]: {
          cargando: false,
          error: r.h ? null : 'No se pudo cargar el horario.',
          horario: r.h,
          pendientes: (r.a ?? []).filter(x => x.situacion === 'PENDIENTE' && !x.vencida).length,
        },
      }));
    });
  }

  /** "5° Primaria - A" */
  grado(h: Hijo): string {
    return h.grado ? `${h.grado}${h.seccion ? ' - ' + h.seccion : ''}` : 'Sin sección asignada';
  }

  titulo(h: MiHorario | null): string {
    return infoGrado(h?.grado)?.titulo ?? h?.grado ?? '';
  }

  nivel(h: MiHorario | null): string {
    return (h?.grado ?? '').includes('Secundaria') ? 'Secundaria' : 'Primaria';
  }
}

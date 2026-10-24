import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { Hijo, HijosService } from '../../../../core/services/hijos.service';
import { AulaService } from '../../../../core/services/aula.service';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { CursoAula } from '../../../../core/models/aula.model';
import { MiHorario } from '../../../../core/models/mi-horario.model';
import { BloqueHorario } from '../../../../core/models/horario.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { iniciales } from '../../../../core/utils/texto';
import { IconoCategoria } from '../../../../shared/components/icono-categoria/icono-categoria';
import { FotoUsuario } from '../../../../shared/components/foto-usuario/foto-usuario';

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

interface Cursos { cargando: boolean; error: string | null; cursos: CursoAula[]; horario: MiHorario | null; }

/**
 * Padre > Mis Hijos: un acordeón por hijo con las tarjetas de sus cursos.
 * "Ver detalle" abre el curso en modo solo lectura (el padre ve, pero no envía ni edita nada).
 */
@Component({
  selector: 'app-padre-mis-hijos',
  standalone: true,
  imports: [FotoUsuario, CommonModule, FormsModule, RouterLink, IconoCategoria],
  templateUrl: './mis-hijos.html',
})
export class PadreMisHijos implements OnInit {
  private hijosService = inject(HijosService);
  private aula = inject(AulaService);
  private miHorario = inject(MiHorarioService);

  readonly iniciales = iniciales;

  hijos = signal<Hijo[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');
  abiertos = signal<Set<number>>(new Set());
  datos = signal<Record<number, Cursos>>({});

  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    return t ? this.hijos().filter(h => h.nombre.toLowerCase().includes(t) || (h.salon ?? '').toLowerCase().includes(t)) : this.hijos();
  });

  ngOnInit(): void {
    this.hijosService.listar().subscribe({
      next: (h) => {
        this.hijos.set(h);
        this.cargando.set(false);
        // Abre el hijo elegido antes (o el primero).
        const elegido = h.find(x => x.id === this.hijosService.seleccionado()) ?? h[0];
        if (elegido) this.alternar(elegido.id);
      },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudo cargar a tus hijos.'); },
    });
  }

  abierto(id: number): boolean { return this.abiertos().has(id); }

  alternar(id: number): void {
    const s = new Set(this.abiertos());
    if (s.has(id)) s.delete(id);
    else { s.add(id); this.cargar(id); this.hijosService.elegir(id); }
    this.abiertos.set(s);
  }

  de(id: number): Cursos | undefined { return this.datos()[id]; }

  private cargar(id: number): void {
    const actual = this.datos()[id];
    if (actual && !actual.error) return;
    this.datos.update(d => ({ ...d, [id]: { cargando: true, error: null, cursos: [], horario: null } }));
    forkJoin({
      c: this.aula.cursosHijo(id).pipe(catchError((e) => of({ error: e?.error?.mensaje ?? 'No se pudieron cargar sus cursos.' }))),
      h: this.miHorario.hijo(id).pipe(catchError(() => of(null))),
    }).subscribe(r => {
      const err = !Array.isArray(r.c) ? (r.c as { error: string }).error : null;
      this.datos.update(d => ({
        ...d,
        [id]: { cargando: false, error: err, cursos: Array.isArray(r.c) ? r.c : [], horario: r.h },
      }));
    });
  }

  grado(h: Hijo): string {
    return h.grado ? `${h.grado}${h.seccion ? ' - ' + h.seccion : ''}` : 'Sin sección asignada';
  }

  salon(c: CursoAula): string {
    return `${infoGrado(c.grado)?.titulo ?? c.grado} “${c.letra}”`;
  }

  nivel(c: CursoAula): string {
    return c.grado.includes('Secundaria') ? 'Secundaria' : 'Primaria';
  }

  private bloques(hijoId: number, c: CursoAula): BloqueHorario[] {
    return this.datos()[hijoId]?.horario?.cursos.find(x => x.id === c.seccionCursoId)?.bloques ?? [];
  }

  /** "Lun - Mié - Vie" */
  dias(hijoId: number, c: CursoAula): string {
    const dias = [...new Set(this.bloques(hijoId, c).map(b => b.dia))].sort();
    return dias.length ? dias.map(d => DIAS_CORTOS[d - 1]).join(' - ') : 'Sin horario';
  }

  /** "08:00 - 08:50" (o "(varía)" si cambia según el día). */
  horas(hijoId: number, c: CursoAula): string {
    const rangos = [...new Set(this.bloques(hijoId, c).map(b => `${b.horaInicio} - ${b.horaFin}`))];
    if (!rangos.length) return '';
    return rangos.length === 1 ? rangos[0] : `${rangos[0]} (varía)`;
  }
}

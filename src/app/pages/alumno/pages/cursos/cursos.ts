import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AulaService } from '../../../../core/services/aula.service';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { CursoAula } from '../../../../core/models/aula.model';
import { MiHorario } from '../../../../core/models/mi-horario.model';
import { BloqueHorario } from '../../../../core/models/horario.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { IconoCategoria } from '../../../../shared/components/icono-categoria/icono-categoria';

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

/** Alumno > Mis Cursos: tarjetas de los cursos de su sección; "Ver curso" abre el aula del curso. */
@Component({
  selector: 'app-alumno-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconoCategoria],
  templateUrl: './cursos.html',
})
export class AlumnoCursos implements OnInit {

  private aula = inject(AulaService);
  private miHorarioService = inject(MiHorarioService);

  cursos = signal<CursoAula[]>([]);
  horario = signal<MiHorario | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    if (!t) return this.cursos();
    return this.cursos().filter(c => c.curso.toLowerCase().includes(t) || (c.docente ?? '').toLowerCase().includes(t));
  });

  ngOnInit(): void {
    this.aula.misCursos().subscribe({
      next: (c) => { this.cursos.set(c); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar tus cursos.'); },
    });
    this.miHorarioService.obtener().subscribe({ next: (h) => this.horario.set(h), error: () => {} });
  }

  salon(c: CursoAula): string {
    return `${infoGrado(c.grado)?.titulo ?? c.grado} “${c.letra}”`;
  }

  nivel(c: CursoAula): string {
    return c.grado.includes('Secundaria') ? 'Secundaria' : 'Primaria';
  }

  private bloques(c: CursoAula): BloqueHorario[] {
    return this.horario()?.cursos.find(x => x.id === c.seccionCursoId)?.bloques ?? [];
  }

  /** "Lun - Mié - Vie" */
  dias(c: CursoAula): string {
    const dias = [...new Set(this.bloques(c).map(b => b.dia))].sort();
    return dias.length ? dias.map(d => DIAS_CORTOS[d - 1]).join(' - ') : 'Sin horario';
  }

  /** "08:00 - 08:50" (o "Varía" si cambia según el día). */
  horas(c: CursoAula): string {
    const rangos = [...new Set(this.bloques(c).map(b => `${b.horaInicio} - ${b.horaFin}`))];
    if (!rangos.length) return '';
    return rangos.length === 1 ? rangos[0] : `${rangos[0]} (varía)`;
  }
}

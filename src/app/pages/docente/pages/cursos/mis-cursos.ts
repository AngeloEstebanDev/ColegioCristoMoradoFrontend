import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AulaService } from '../../../../core/services/aula.service';
import { MiHorarioService } from '../../../../core/services/mi-horario.service';
import { CursoAula } from '../../../../core/models/aula.model';
import { BloqueDocente } from '../../../../core/models/mi-horario.model';
import { infoGrado } from '../../../../core/models/seccion.model';
import { IconoCategoria } from '../../../../shared/components/icono-categoria/icono-categoria';

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

/** Docente > Mis Cursos ("Cursos a Cargo"): una tarjeta por curso y sección; "Ver curso" abre su detalle. */
@Component({
  selector: 'app-docente-mis-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconoCategoria],
  templateUrl: './mis-cursos.html',
})
export class DocenteMisCursos implements OnInit {
  private aula = inject(AulaService);
  private horario = inject(MiHorarioService);

  cursos = signal<CursoAula[]>([]);
  bloques = signal<BloqueDocente[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  busqueda = signal('');

  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    if (!t) return this.cursos();
    return this.cursos().filter(c => `${c.curso} ${c.grado} ${c.letra}`.toLowerCase().includes(t));
  });

  ngOnInit(): void {
    this.aula.cursosDocente().subscribe({
      next: (c) => { this.cursos.set(c); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar tus cursos.'); },
    });
    this.horario.docente().subscribe({ next: (h) => this.bloques.set(h.bloques), error: () => {} });
  }

  salon(c: CursoAula): string { return `${infoGrado(c.grado)?.titulo ?? c.grado} “${c.letra}”`; }
  nivel(c: CursoAula): string { return c.grado.includes('Secundaria') ? 'Secundaria' : 'Primaria'; }

  private suyos(c: CursoAula): BloqueDocente[] { return this.bloques().filter(b => b.seccionCursoId === c.seccionCursoId); }

  dias(c: CursoAula): string {
    const dias = [...new Set(this.suyos(c).map(b => b.dia))].sort();
    return dias.length ? dias.map(d => DIAS_CORTOS[d - 1]).join(' - ') : 'Sin horario';
  }

  horas(c: CursoAula): string {
    const rangos = [...new Set(this.suyos(c).map(b => `${b.horaInicio} - ${b.horaFin}`))];
    if (!rangos.length) return '';
    return rangos.length === 1 ? rangos[0] : `${rangos[0]} (varía)`;
  }
}

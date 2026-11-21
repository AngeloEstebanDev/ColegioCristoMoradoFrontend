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

/** Constante DIAS_CORTOS: valor fijo (días cortos) que se reutiliza en varias partes. */
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

/** Docente > Mis Cursos ("Cursos a Cargo"): una tarjeta por curso y sección; "Ver curso" abre su detalle. */
@Component({
  selector: 'app-docente-mis-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconoCategoria],
  templateUrl: './mis-cursos.html',
})
export class DocenteMisCursos implements OnInit {
  /** Servicio AulaService (inyectado por Angular). */
  private aula = inject(AulaService);
  /** Servicio MiHorarioService (inyectado por Angular). */
  private horario = inject(MiHorarioService);

  /** Estado (signal): cursos. */
  cursos = signal<CursoAula[]>([]);
  /** Estado (signal): bloques. */
  bloques = signal<BloqueDocente[]>([]);
  /** Estado (signal): cargando. */
  cargando = signal(true);
  /** Estado (signal): error. */
  error = signal<string | null>(null);
  /** Estado (signal): búsqueda. */
  busqueda = signal('');

  /** Valor calculado (computed): filtrados. Se actualiza solo. */
  filtrados = computed(() => {
    const t = this.busqueda().toLowerCase().trim();
    if (!t) return this.cursos();
    return this.cursos().filter(c => `${c.curso} ${c.grado} ${c.letra}`.toLowerCase().includes(t));
  });

  /**
   * Se ejecuta una sola vez al abrir la pantalla (cuando Angular crea el componente): aquí se cargan
   * los datos iniciales. Pide los datos al backend con aula.cursosDocente(), horario.docente() y
   * actualiza la pantalla cuando llega la respuesta.
   */
  ngOnInit(): void {
    this.aula.cursosDocente().subscribe({
      next: (c) => { this.cursos.set(c); this.cargando.set(false); },
      error: (e) => { this.cargando.set(false); this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar tus cursos.'); },
    });
    this.horario.docente().subscribe({ next: (h) => this.bloques.set(h.bloques), error: () => {} });
  }

  /** Devuelve el texto de «salon». */
  salon(c: CursoAula): string { return `${infoGrado(c.grado)?.titulo ?? c.grado} “${c.letra}”`; }
  /** Devuelve el texto de «nivel». */
  nivel(c: CursoAula): string { return c.grado.includes('Secundaria') ? 'Secundaria' : 'Primaria'; }

  /** Devuelve «suyos». */
  private suyos(c: CursoAula): BloqueDocente[] { return this.bloques().filter(b => b.seccionCursoId === c.seccionCursoId); }

  /** Devuelve el texto de «días». */
  dias(c: CursoAula): string {
    const dias = [...new Set(this.suyos(c).map(b => b.dia))].sort();
    return dias.length ? dias.map(d => DIAS_CORTOS[d - 1]).join(' - ') : 'Sin horario';
  }

  /** Devuelve el texto de «horas». */
  horas(c: CursoAula): string {
    const rangos = [...new Set(this.suyos(c).map(b => `${b.horaInicio} - ${b.horaFin}`))];
    if (!rangos.length) return '';
    return rangos.length === 1 ? rangos[0] : `${rangos[0]} (varía)`;
  }
}

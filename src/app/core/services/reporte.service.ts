import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpcionesReporte, ParametrosReporte, TablaReporte, TipoReporte } from '../models/reporte.model';
import { environment } from '../../../environments/environment';

/** HU-30/31 Reportes (requiere el permiso REPORTES). */
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/reportes`;

  /** Periodos, grados, secciones, cursos y alumnos para los filtros. */
  opciones(): Observable<OpcionesReporte> { return this.http.get<OpcionesReporte>(`${this.api}/opciones`); }

  generar(tipo: TipoReporte, p: ParametrosReporte): Observable<TablaReporte> {
    return this.http.get<TablaReporte>(`${this.api}/${tipo}`, { params: parametros(p) });
  }

  /** Descarga el reporte en Excel (.xlsx). */
  excel(tipo: TipoReporte, p: ParametrosReporte): Observable<Blob> {
    return this.http.get(`${this.api}/${tipo}/excel`, { params: parametros(p), responseType: 'blob' });
  }
}

function parametros(p: ParametrosReporte): Record<string, string> {
  const r: Record<string, string> = {};
  if (p.periodoId) r['periodoId'] = String(p.periodoId);
  if (p.grado) r['grado'] = p.grado;
  if (p.seccionId) r['seccionId'] = String(p.seccionId);
  if (p.estudianteId) r['estudianteId'] = String(p.estudianteId);
  if (p.cursoId) r['cursoId'] = String(p.cursoId);
  return r;
}

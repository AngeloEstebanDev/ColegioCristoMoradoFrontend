import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Modelo Hijo: describe la forma de los datos de «hijo». */
export interface Hijo {
  id: number;
  nombre: string;
  grado: string | null;
  seccion: string | null;
  salon: string;
  parentesco: string;
  estado: string;
  /** Cuenta del alumno (para su foto de perfil). */
  usuarioId?: number | null;
}

/** Constante CLAVE: valor fijo (clave) que se reutiliza en varias partes. */
const CLAVE = 'hijo_seleccionado';

/** Padre de familia: sus hijos y el hijo elegido (se recuerda entre páginas). */
@Injectable({ providedIn: 'root' })
export class HijosService {
  /** Servicio HttpClient (inyectado por Angular). */
  private http = inject(HttpClient);

  /** Estado (signal): seleccionado. */
  readonly seleccionado = signal<number | null>(leer());

  /**
   * Pide al backend la lista completa. Llama al backend: GET /api/mis-hijos. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  listar(): Observable<Hijo[]> {
    return this.http.get<Hijo[]>(`${environment.apiUrl}/mis-hijos`).pipe(
      tap(hijos => {
        const actual = this.seleccionado();
        if (!hijos.some(h => h.id === actual)) this.elegir(hijos[0]?.id ?? null);
      }),
    );
  }

  /** Elige los datos de esta pantalla. */
  elegir(id: number | null): void {
    this.seleccionado.set(id);
    try {
      if (id) sessionStorage.setItem(CLAVE, String(id)); else sessionStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento */ }
  }
}

/** Lee los datos de esta pantalla. */
function leer(): number | null {
  try {
    const v = sessionStorage.getItem(CLAVE);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

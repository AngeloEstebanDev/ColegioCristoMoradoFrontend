import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

const CLAVE = 'hijo_seleccionado';

/** Padre de familia: sus hijos y el hijo elegido (se recuerda entre páginas). */
@Injectable({ providedIn: 'root' })
export class HijosService {
  private http = inject(HttpClient);

  readonly seleccionado = signal<number | null>(leer());

  listar(): Observable<Hijo[]> {
    return this.http.get<Hijo[]>(`${environment.apiUrl}/mis-hijos`).pipe(
      tap(hijos => {
        const actual = this.seleccionado();
        if (!hijos.some(h => h.id === actual)) this.elegir(hijos[0]?.id ?? null);
      }),
    );
  }

  elegir(id: number | null): void {
    this.seleccionado.set(id);
    try {
      if (id) sessionStorage.setItem(CLAVE, String(id)); else sessionStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento */ }
  }
}

function leer(): number | null {
  try {
    const v = sessionStorage.getItem(CLAVE);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

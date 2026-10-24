import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ArchivoInfo, ArchivoNuevo } from '../models/aula.model';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export const ARCHIVO_MAX_BYTES = 10 * 1024 * 1024;

/** Lee archivos del equipo (base64) y descarga los del servidor. */
@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  /** Descarga con la cabecera X-Usuario-Id (la agrega el interceptor). */
  descargar(a: ArchivoInfo): void {
    this.http.get(`${environment.apiUrl}/archivos/${a.id}`, { responseType: 'blob' }).subscribe({
      next: (blob) => guardarBlob(blob, a.nombre),
      error: () => this.toast.error('No se pudo descargar el archivo.'),
    });
  }

  /** Lee un archivo elegido por el usuario. Rechaza si pesa más de 10 MB. */
  leer(archivo: File): Promise<ArchivoNuevo> {
    return new Promise((resolve, reject) => {
      if (archivo.size > ARCHIVO_MAX_BYTES) { reject(new Error('El archivo pesa más de 10 MB.')); return; }
      if (archivo.size === 0) { reject(new Error('El archivo está vacío.')); return; }
      const lector = new FileReader();
      lector.onload = () => resolve({
        nombre: archivo.name,
        tipo: archivo.type || 'application/octet-stream',
        contenido: lector.result as string,
      });
      lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      lector.readAsDataURL(archivo);
    });
  }
}

export function guardarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 1536 -> "1.5 KB" */
export function tamanioLegible(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Extensión en mayúsculas para el ícono del archivo ("PDF", "DOCX"...). */
export function extension(nombre: string | null | undefined): string {
  const n = nombre ?? '';
  const i = n.lastIndexOf('.');
  return i >= 0 ? n.substring(i + 1).toUpperCase().slice(0, 4) : 'ARCH';
}

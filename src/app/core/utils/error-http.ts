export function mensajeHttp(err: any, porDefecto: string): string {
  const mensaje = err?.error?.mensaje;
  if (typeof mensaje === 'string' && mensaje.trim()) return mensaje;
  if (err?.status === 0) {
    return 'No hay conexión con el servidor. Si es la versión en la nube, espera unos segundos mientras se activa e intenta de nuevo; si es local, revisa que el backend esté encendido.';
  }
  if (err?.status === 504 || err?.status === 502 || err?.status === 503) {
    return 'El servidor tardó en responder. Intenta de nuevo en unos segundos.';
  }
  return porDefecto;
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chat, Contactos, Conversacion, Mensaje, MensajeChat, MensajeRequest, Borrador, BorradorRequest } from '../models/mensaje.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private apiUrl = `${environment.apiUrl}/mensajes`;

  constructor(private http: HttpClient) {}

  private p(usuarioId: number): { params: HttpParams } {
    return { params: new HttpParams().set('usuarioId', usuarioId) };
  }

  contactos(usuarioId: number): Observable<Contactos> {
    return this.http.get<Contactos>(`${this.apiUrl}/contactos`, this.p(usuarioId));
  }

  // ---- Chat ----

  conversaciones(usuarioId: number): Observable<Conversacion[]> {
    return this.http.get<Conversacion[]>(`${this.apiUrl}/conversaciones`, this.p(usuarioId));
  }

  /** Abre el chat con otro usuario (0 = Avisos del colegio). Marca lo recibido como leído. */
  conversacion(otroId: number, usuarioId: number): Observable<Chat> {
    return this.http.get<Chat>(`${this.apiUrl}/conversaciones/${otroId}`, this.p(usuarioId));
  }

  enviarChat(otroId: number, usuarioId: number, contenido: string): Observable<MensajeChat> {
    return this.http.post<MensajeChat>(`${this.apiUrl}/conversaciones/${otroId}`, { contenido }, this.p(usuarioId));
  }

  eliminarConversacion(otroId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversaciones/${otroId}`, this.p(usuarioId));
  }

  // ---- Bandejas (mensajes a grupos) ----

  recibidos(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/recibidos`, this.p(usuarioId));
  }

  enviados(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/enviados`, this.p(usuarioId));
  }

  enviar(usuarioId: number, datos: MensajeRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(this.apiUrl, datos, this.p(usuarioId));
  }

  /** Avisos del colegio sin leer (para el modal que aparece al entrar a la cuenta). */
  avisosPendientes(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/avisos-pendientes`, this.p(usuarioId));
  }

  marcarAvisosLeidos(ids: number[], usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/avisos/leidos`, ids, this.p(usuarioId));
  }

  marcarLeido(id: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leido`, null, this.p(usuarioId));
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.p(usuarioId));
  }

  // ---- Borradores (solo los ve su autor) ----

  borradores(usuarioId: number): Observable<Borrador[]> {
    return this.http.get<Borrador[]>(`${this.apiUrl}/borradores`, this.p(usuarioId));
  }

  /** Sin id crea un borrador; con id lo actualiza. */
  guardarBorrador(usuarioId: number, datos: BorradorRequest): Observable<Borrador> {
    return this.http.post<Borrador>(`${this.apiUrl}/borradores`, datos, this.p(usuarioId));
  }

  eliminarBorrador(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/borradores/${id}`, this.p(usuarioId));
  }
}

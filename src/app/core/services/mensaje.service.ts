import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chat, Contactos, Conversacion, Mensaje, MensajeChat, MensajeRequest, Borrador, BorradorRequest } from '../models/mensaje.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio MensajeService: se comunica con el backend en /api/mensajes (envía y recibe JSON con
 * HttpClient). Al ser providedIn: "root", Angular crea una sola instancia y la comparte en toda la
 * aplicación.
 */
@Injectable({ providedIn: 'root' })
export class MensajeService {
  /** Dirección base del backend para este servicio: /api/mensajes. */
  private apiUrl = `${environment.apiUrl}/mensajes`;

  /** function Object() { [native code] } */
  constructor(private http: HttpClient) {}

  /** Devuelve «p». */
  private p(usuarioId: number): { params: HttpParams } {
    return { params: new HttpParams().set('usuarioId', usuarioId) };
  }

  /**
   * Devuelve «contactos». Llama al backend: GET /api/mensajes/contactos. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
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

  /**
   * Envía chat. Llama al backend: POST /api/mensajes/conversaciones/{otroId}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  enviarChat(otroId: number, usuarioId: number, contenido: string): Observable<MensajeChat> {
    return this.http.post<MensajeChat>(`${this.apiUrl}/conversaciones/${otroId}`, { contenido }, this.p(usuarioId));
  }

  /**
   * Elimina conversacion. Llama al backend: DELETE /api/mensajes/conversaciones/{otroId}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
  eliminarConversacion(otroId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversaciones/${otroId}`, this.p(usuarioId));
  }

  // ---- Bandejas (mensajes a grupos) ----

  recibidos(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/recibidos`, this.p(usuarioId));
  }

  /**
   * Devuelve «enviados». Llama al backend: GET /api/mensajes/enviados. Devuelve un Observable (los
   * datos llegan al hacer subscribe).
   */
  enviados(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/enviados`, this.p(usuarioId));
  }

  /**
   * Envía los datos de esta pantalla. Llama al backend: POST /api/mensajes. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  enviar(usuarioId: number, datos: MensajeRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(this.apiUrl, datos, this.p(usuarioId));
  }

  /** Avisos del colegio sin leer (para el modal que aparece al entrar a la cuenta). */
  avisosPendientes(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/avisos-pendientes`, this.p(usuarioId));
  }

  /**
   * Marca avisos leidos. Llama al backend: POST /api/mensajes/avisos/leidos. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  marcarAvisosLeidos(ids: number[], usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/avisos/leidos`, ids, this.p(usuarioId));
  }

  /**
   * Marca leido. Llama al backend: POST /api/mensajes/{id}/leido. Devuelve un Observable (los datos
   * llegan al hacer subscribe).
   */
  marcarLeido(id: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leido`, null, this.p(usuarioId));
  }

  /**
   * Pide al backend borrar un registro. Llama al backend: DELETE /api/mensajes/{id}. Devuelve un
   * Observable (los datos llegan al hacer subscribe).
   */
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

  /**
   * Elimina borrador. Llama al backend: DELETE /api/mensajes/borradores/{id}. Devuelve un Observable
   * (los datos llegan al hacer subscribe).
   */
  eliminarBorrador(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/borradores/${id}`, this.p(usuarioId));
  }
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './shared/components/toasts/toasts';
import { Confirmacion } from './shared/components/confirmacion/confirmacion';

/**
 * Componente «app» de la aplicación. Se usa en el HTML con la etiqueta <app-root>. Su vista está en
 * app.html; aquí (en el .ts) va la lógica: los datos que se muestran, lo que pasa al hacer clic y las
 * llamadas a los servicios.
 */
@Component({
  imports: [RouterOutlet, Toasts, Confirmacion],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  /** Estado (signal): title. */
  protected readonly title = signal('CristoMorado-frontend');
}

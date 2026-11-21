import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './shared/components/toasts/toasts';
import { Confirmacion } from './shared/components/confirmacion/confirmacion';

@Component({
  imports: [RouterOutlet, Toasts, Confirmacion],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('CristoMorado-frontend');
}

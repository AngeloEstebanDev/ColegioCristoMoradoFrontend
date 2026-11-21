import { Component } from '@angular/core';

/**
 * Componente «directiva» del panel de Administración (administrador y directiva). Se usa en el HTML
 * con la etiqueta <app-directiva>. Su vista está en directiva.html; aquí (en el .ts) va la lógica: los
 * datos que se muestran, lo que pasa al hacer clic y las llamadas a los servicios.
 */
@Component({
  imports: [],
  selector: 'app-directiva',
  templateUrl: './directiva.html',
})
export class Directiva {}

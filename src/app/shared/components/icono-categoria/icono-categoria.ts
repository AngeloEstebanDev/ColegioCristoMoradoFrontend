import { Component, computed, input } from '@angular/core';
import { categoriaDe } from '../../../core/models/curso.model';

/** Ícono de la categoría de un curso, en un cuadrito con su color. */
@Component({
  selector: 'app-icono-categoria',
  standalone: true,
  template: `
    <span class="inline-flex items-center justify-center shrink-0"
          [style.width.px]="tam()" [style.height.px]="tam()" [style.border-radius.px]="tam() / 4"
          [style.background]="sinFondo() ? 'transparent' : info().fondo" [style.color]="color() ?? info().color">
      <svg viewBox="0 0 24 24" fill="currentColor" [style.width.px]="tam() * 0.6" [style.height.px]="tam() * 0.6">
        @switch (info().clave) {
          @case ('MATEMATICA') { <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm1 3v4h10V5H7Zm0 6v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v6h2v-6h-2Zm-8 4v2h2v-2H7Zm4 0v2h2v-2h-2Z"/> }
          @case ('COMUNICACION') { <path d="M12 6.5C10.4 5.3 8 4.5 5 4.5c-1 0-2 .1-3 .3v14c1-.2 2-.3 3-.3 3 0 5.4.8 7 2 1.6-1.2 4-2 7-2 1 0 2 .1 3 .3v-14c-1-.2-2-.3-3-.3-3 0-5.4.8-7 2Z"/> }
          @case ('CIENCIA') { <path d="M9 2h6v2h-1v5.3l5.6 9.4A2 2 0 0 1 17.9 22H6.1a2 2 0 0 1-1.7-3.3L10 9.3V4H9V2Zm-.5 13h7l-2.5-4.2V9.3h-2v1.5L8.5 15Z"/> }
          @case ('SOCIALES') { <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8ZM12 4a14 14 0 0 1 1.9 4h-3.8A14 14 0 0 1 12 4ZM4.3 14a8 8 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16ZM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.4 6.7 8 8Zm4 12a14 14 0 0 1-1.9-4h3.8A14 14 0 0 1 12 20Zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4Zm.3 5.6A15.7 15.7 0 0 0 16 16h2.9a8 8 0 0 1-4.3 3.6Zm1.7-5.6a16.5 16.5 0 0 0 0-4h3.4a8 8 0 0 1 0 4h-3.4Z"/> }
          @case ('IDIOMAS') { <path d="m12.9 15.1-2.6-2.5.1-.1A17.6 17.6 0 0 0 14 6h3V4h-7V2H8v2H1v2h11.2A15.8 15.8 0 0 1 9 11.4 15.6 15.6 0 0 1 6.7 8H4.7a17.6 17.6 0 0 0 3 4.6L2.6 17.6 4 19l5-5 3.1 3.1.8-2ZM18.5 10h-2L12 22h2l1.1-3h4.8l1.1 3h2l-4.5-12Zm-2.6 7 1.6-4.3 1.6 4.3h-3.2Z"/> }
          @case ('ARTE') { <path d="M12 3v10.6A4 4 0 1 0 14 17V7h4V3h-6Z"/> }
          @case ('FORMACION') { <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13Zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5Z"/> }
          @case ('COMPUTACION') { <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V5Zm2 0v8h12V5H6ZM2 17h20v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1Z"/> }
          @default { <path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/> }
        }
      </svg>
    </span>
  `,
})
export class IconoCategoria {
  categoria = input<string | null | undefined>(null);
  tam = input(32);
  sinFondo = input(false);
  /** Color del ícono (opcional, p. ej. blanco sobre la portada del curso). */
  color = input<string | null>(null);
  info = computed(() => categoriaDe(this.categoria()));
}

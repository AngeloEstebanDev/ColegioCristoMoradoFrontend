import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild,
} from '@angular/core';

/**
 * Editor de texto sencillo (negrita, cursiva, subrayado, listas, alineación).
 * Uso: <app-editor-texto [contenido]="html" (contenidoChange)="html = $event" />
 * Devuelve HTML simple; al mostrarlo, Angular lo sanitiza con [innerHTML].
 */
@Component({
  selector: 'app-editor-texto',
  standalone: true,
  templateUrl: './editor-texto.html',
  styleUrl: './editor-texto.css',
})
export class EditorTexto implements AfterViewInit {

  @Input() placeholder = 'Escribe un mensaje...';
  @Input() alto = 160;
  @Output() contenidoChange = new EventEmitter<string>();

  @ViewChild('area', { static: true }) area!: ElementRef<HTMLDivElement>;

  private pendiente = '';

  @Input() set contenido(valor: string | null | undefined) {
    const html = valor ?? '';
    if (this.area?.nativeElement) {
      if (this.area.nativeElement.innerHTML !== html) this.area.nativeElement.innerHTML = html;
    } else {
      this.pendiente = html;
    }
  }

  readonly botones = [
    { cmd: 'bold', titulo: 'Negrita', html: '<b>B</b>' },
    { cmd: 'italic', titulo: 'Cursiva', html: '<i>I</i>' },
    { cmd: 'underline', titulo: 'Subrayado', html: '<u>U</u>' },
    { cmd: 'insertUnorderedList', titulo: 'Lista con viñetas', html: '•≡' },
    { cmd: 'insertOrderedList', titulo: 'Lista numerada', html: '1≡' },
    { cmd: 'justifyLeft', titulo: 'Alinear a la izquierda', html: '⇤' },
    { cmd: 'justifyCenter', titulo: 'Centrar', html: '↔' },
    { cmd: 'removeFormat', titulo: 'Quitar formato', html: 'T̶' },
  ];

  ngAfterViewInit(): void {
    if (this.pendiente) this.area.nativeElement.innerHTML = this.pendiente;
  }

  ejecutar(cmd: string): void {
    this.area.nativeElement.focus();
    // execCommand sigue funcionando en todos los navegadores para esto.
    document.execCommand(cmd, false);
    this.emitir();
  }

  emitir(): void {
    const el = this.area.nativeElement;
    // Si solo quedó un <br> vacío, lo tratamos como vacío.
    const html = (el.textContent ?? '').trim() === '' && !el.querySelector('img') ? '' : el.innerHTML;
    this.contenidoChange.emit(html);
  }

  /** Al pegar, solo se pega texto (evita estilos raros de Word/web). */
  pegar(ev: ClipboardEvent): void {
    ev.preventDefault();
    const texto = ev.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, texto);
    this.emitir();
  }
}

import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/services/confirm.service';

/** Ventana de confirmación pequeña y centrada (con el estilo del colegio). */
@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirm.actual(); as p) {
      <div class="fixed inset-0 z-[190] flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4">
        <div class="absolute inset-0 bg-[#241521]/40 backdrop-blur-[2px] confirm-fondo" (click)="confirm.responder(false)"></div>
        <div class="confirm-caja relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-[#E3D5C4] overflow-hidden" role="dialog" aria-modal="true">
          <div class="px-5 pt-5 pb-4 flex gap-3.5">
            <span class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
                  [ngClass]="p.peligro ? 'bg-[#FBE7E9] text-[#A62639]' : 'bg-[#EFEAF3] text-[#4A1F52]'">
              @if (p.peligro) {
                <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 8v5M12 16.5v.5M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 16.5v.5"/></svg>
              }
            </span>
            <div class="min-w-0">
              <h3 class="font-serif font-bold text-[17px] text-[#241521] leading-tight">{{ p.titulo }}</h3>
              <p class="mt-1.5 text-[13.5px] leading-snug text-[#3A2A37] whitespace-pre-line">{{ p.texto }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-2 px-5 py-3 bg-[#FBF7F1] border-t border-[#F0E6D8]">
            <button type="button" (click)="confirm.responder(false)"
                    class="px-4 py-2 rounded-lg border border-[#E3D5C4] bg-white text-[13px] font-medium text-[#241521] hover:bg-[#F5EEE3]">{{ p.cancelar }}</button>
            <button type="button" (click)="confirm.responder(true)" #ok
                    class="px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
                    [ngClass]="p.peligro ? 'bg-[#A62639] hover:bg-[#8C1F30]' : 'bg-[#2E1233] hover:bg-[#4A1F52]'">{{ p.aceptar }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-fondo { animation: cfFondo .18s ease-out; }
    .confirm-caja { animation: cfCaja .22s cubic-bezier(.2,.8,.2,1); }
    @keyframes cfFondo { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cfCaja { from { opacity: 0; transform: translateY(-10px) scale(.97); } to { opacity: 1; transform: none; } }
  `],
})
export class Confirmacion {
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  escape(): void { this.confirm.responder(false); }

  @HostListener('document:keydown.enter', ['$event'])
  enter(ev: Event): void {
    if (!this.confirm.actual()) return;
    ev.preventDefault();
    this.confirm.responder(true);
  }
}

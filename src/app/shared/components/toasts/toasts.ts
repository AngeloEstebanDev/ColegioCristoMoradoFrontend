import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoToast, ToastService } from '../../../core/services/toast.service';

const ESTILO: Record<TipoToast, { color: string; fondo: string; titulo: string; icono: string }> = {
  exito: { color: '#1E7A3B', fondo: '#E7F3EA', titulo: 'Listo', icono: 'M5 12.5l4.5 4.5L19 7.5' },
  error: { color: '#A62639', fondo: '#FBE7E9', titulo: 'Atención', icono: 'M12 7.5v5.5M12 16.5v.5' },
  info: { color: '#4A1F52', fondo: '#EFEAF3', titulo: 'Aviso', icono: 'M12 11v5.5M12 7.5v.5' },
  aviso: { color: '#B45309', fondo: '#FEF3E2', titulo: 'Importante', icono: 'M12 7.5v5.5M12 16.5v.5' },
};

/** Notificaciones arriba al centro: pequeñas, con color según el tipo y se cierran solas. */
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 w-[calc(100%-32px)] max-w-[420px] pointer-events-none"
         aria-live="polite" role="status">
      @for (t of toasts.lista(); track t.id) {
        @let e = estilo[t.tipo];
        <div class="toast-entra pointer-events-auto w-full flex items-start gap-3 pl-3 pr-2 py-2.5 rounded-xl bg-white/95 backdrop-blur border border-[#E3D5C4] shadow-[0_10px_30px_-10px_rgba(36,21,33,0.35)] overflow-hidden relative">
          <span class="absolute left-0 top-0 bottom-0 w-1" [style.background]="e.color"></span>
          <span class="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center" [style.background]="e.fondo" [style.color]="e.color">
            <svg viewBox="0 0 24 24" fill="none" class="w-3.5 h-3.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="e.icono"/></svg>
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-semibold leading-tight" [style.color]="e.color">{{ e.titulo }}</p>
            <p class="text-[13px] leading-snug text-[#241521] break-words">{{ t.texto }}</p>
          </div>
          <button type="button" (click)="toasts.cerrar(t.id)" class="p-1 rounded-md text-[#9A8E97] hover:text-[#241521] hover:bg-[#F5EEE3]" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" class="w-3.5 h-3.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <span class="toast-barra absolute left-0 bottom-0 h-[2px]" [style.background]="e.color" [style.animation-duration.ms]="t.ms"></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-entra { animation: toastEntra .28s cubic-bezier(.2,.8,.2,1); }
    .toast-barra { width: 100%; opacity: .35; animation-name: toastBarra; animation-timing-function: linear; animation-fill-mode: forwards; }
    @keyframes toastEntra { from { opacity: 0; transform: translateY(-12px) scale(.97); } to { opacity: 1; transform: none; } }
    @keyframes toastBarra { from { width: 100%; } to { width: 0%; } }
  `],
})
export class Toasts {
  readonly toasts = inject(ToastService);
  readonly estilo = ESTILO;
}

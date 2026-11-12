// ─────────────────────────────────────────────
//  PlanGym — gp-toast (contenedor global de avisos)
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'gp-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <button type="button" class="toast toast--{{ t.kind }}" (click)="toast.dismiss(t.id)">
          {{ t.text }}
        </button>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed; left: 50%; bottom: calc(84px + env(safe-area-inset-bottom));
      transform: translateX(-50%); z-index: 2000;
      display: flex; flex-direction: column; gap: var(--space-2);
      width: min(420px, calc(100vw - 32px)); pointer-events: none;
    }
    .toast {
      pointer-events: auto; text-align: left; cursor: pointer;
      font: 500 14px var(--font-body); color: var(--color-text);
      background: var(--color-card); border: 1px solid var(--color-border);
      border-left: 4px solid var(--color-accent); border-radius: var(--radius-sm);
      padding: var(--space-3) var(--space-4); box-shadow: var(--shadow-card);
      animation: toast-in var(--duration-base) var(--ease-spring);
    }
    .toast--success { border-left-color: var(--color-success); }
    .toast--error   { border-left-color: var(--color-danger); }
    @keyframes toast-in { from { opacity: 0; transform: translateY(12px); } }
  `],
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}

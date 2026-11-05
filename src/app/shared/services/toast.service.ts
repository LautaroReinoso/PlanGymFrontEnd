// ─────────────────────────────────────────────
//  PlanGym — ToastService
//  Avisos cortos globales. Se muestran con <gp-toast> (app.component).
// ─────────────────────────────────────────────

import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(text: string): void { this.show('success', text); }
  error(text: string): void   { this.show('error', text, 6000); }
  info(text: string): void    { this.show('info', text); }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(kind: ToastKind, text: string, ms = 3500): void {
    const id = ++this.seq;
    this._toasts.update(list => [...list.slice(-2), { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}

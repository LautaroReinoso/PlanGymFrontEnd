import {
  Component,
  input,
  output,
  signal,
  effect,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
 
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';
 
@Component({
  selector: 'gp-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnDestroy {
 
private readonly renderer = inject(Renderer2);
 
  // ── Inputs ────────────────────────────────────
  readonly isOpen          = input<boolean>(false);
  readonly title           = input<string>('');
  readonly size            = input<ModalSize>('md');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly showClose       = input<boolean>(true);
 
  // ── Outputs ───────────────────────────────────
  readonly closed = output<void>();
 
  // ── Estado interno ────────────────────────────
  // isVisible controla si el DOM existe
  // isAnimatingOut controla la animación de salida
  readonly isVisible      = signal(false);
  readonly isAnimatingOut = signal(false);
 
  private escListener?: () => void;
 
  constructor() {
    // Sincronizar isOpen → ciclo de vida del modal
    effect(() => {
      const open = this.isOpen();
 
      if (open) {
        this.isVisible.set(true);
        this.isAnimatingOut.set(false);
        this.lockScroll(true);
        this.bindEsc();
      } else {
        this.animateClose();
      }
    });
  }
 
  ngOnDestroy(): void {
    this.lockScroll(false);
    this.unbindEsc();
  }
 
  // ── Cerrar ────────────────────────────────────
 
  close(): void {
    this.closed.emit();
  }
 
  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }
 
  // Animar salida antes de destruir el DOM
  private animateClose(): void {
    if (!this.isVisible()) return;
    this.isAnimatingOut.set(true);
    this.lockScroll(false);
    this.unbindEsc();
 
    // Esperar la duración de la animación CSS (280ms)
    setTimeout(() => {
      this.isVisible.set(false);
      this.isAnimatingOut.set(false);
    }, 280);
  }
 
  // ── Helpers ───────────────────────────────────
 
  private lockScroll(lock: boolean): void {
    this.renderer.setStyle(
      document.body,
      'overflow',
      lock ? 'hidden' : ''
    );
  }
 
  private bindEsc(): void {
    this.escListener = this.renderer.listen(
      'document',
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.close();
      }
    );
  }
 
  private unbindEsc(): void {
    this.escListener?.();
    this.escListener = undefined;
  }
 
  // ── Clases CSS computadas ─────────────────────
 
  get panelClass(): string {
    return [
      'modal-panel',
      `modal-panel--${this.size()}`,
      this.isAnimatingOut() ? 'modal-panel--out' : '',
    ].filter(Boolean).join(' ');
  }
 
  get backdropClass(): string {
    return [
      'modal-backdrop',
      this.isAnimatingOut() ? 'modal-backdrop--out' : '',
    ].filter(Boolean).join(' ');
  }
}
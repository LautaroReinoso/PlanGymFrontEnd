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
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

const FOCUSABLE = [
  'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
].join(',');

let nextId = 0;

/**
 * Modal accesible:
 * - foco al primer campo (o al panel) al abrir y vuelve al elemento que lo abrió al cerrar;
 * - Tab / Shift+Tab quedan dentro del modal;
 * - Escape cierra SOLO el modal de arriba (si hay uno abierto sobre otro).
 */
@Component({
  selector: 'gp-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnDestroy {
  /** Modales abiertos, el último es el de arriba */
  private static readonly stack: ModalComponent[] = [];

  private readonly renderer = inject(Renderer2);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly titleId = `gp-modal-title-${++nextId}`;

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

  private keyListener?: () => void;
  private returnFocusTo: HTMLElement | null = null;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Sincronizar isOpen → ciclo de vida del modal
    effect(() => {
      if (this.isOpen()) this.open();
      else this.animateClose();
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.closeTimer);
    this.release();
  }

  // ── Cerrar ────────────────────────────────────

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) this.close();
  }

  // ── Abrir / cerrar ────────────────────────────

  private open(): void {
    clearTimeout(this.closeTimer);
    if (!ModalComponent.stack.includes(this)) {
      const active = document.activeElement;
      this.returnFocusTo = active instanceof HTMLElement && active !== document.body ? active : null;
      ModalComponent.stack.push(this);
    }
    this.isVisible.set(true);
    this.isAnimatingOut.set(false);
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    this.bindKeys();
    // Esperar a que el panel exista en el DOM
    setTimeout(() => this.focusFirst());
  }

  // Animar salida antes de destruir el DOM
  private animateClose(): void {
    if (!this.isVisible()) return;
    this.isAnimatingOut.set(true);
    this.release();

    // Esperar la duración de la animación CSS (280ms)
    this.closeTimer = setTimeout(() => {
      this.isVisible.set(false);
      this.isAnimatingOut.set(false);
    }, 280);
  }

  /** Saca el modal de la pila, devuelve el foco y libera el scroll si no queda ninguno abierto */
  private release(): void {
    const stack = ModalComponent.stack;
    const i = stack.indexOf(this);
    if (i === -1) return;
    stack.splice(i, 1);
    this.unbindKeys();
    if (!stack.length) this.renderer.setStyle(document.body, 'overflow', '');
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target?.isConnected) target.focus();
  }

  // ── Teclado ───────────────────────────────────

  private bindKeys(): void {
    if (this.keyListener) return;
    this.keyListener = this.renderer.listen('document', 'keydown', (e: KeyboardEvent) => {
      if (ModalComponent.stack[ModalComponent.stack.length - 1] !== this) return; // solo el de arriba
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      else if (e.key === 'Tab') this.trapTab(e);
    });
  }

  private unbindKeys(): void {
    this.keyListener?.();
    this.keyListener = undefined;
  }

  private focusables(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    if (!panel) return [];
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  /**
   * Primer campo del contenido; si no hay, el primer botón; si no, el panel.
   * En pantallas táctiles va al panel: enfocar un input abriría el teclado sin que el usuario lo pida.
   */
  private focusFirst(): void {
    const panel = this.panel()?.nativeElement;
    if (!panel || panel.contains(document.activeElement)) return;
    if (window.matchMedia?.('(pointer: coarse)').matches) { panel.focus(); return; }
    const content = panel.querySelector<HTMLElement>('.modal-content');
    const field = content?.querySelector<HTMLElement>('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])');
    (field ?? this.focusables().find(el => !el.classList.contains('modal-close-btn')) ?? panel).focus();
  }

  private trapTab(e: KeyboardEvent): void {
    const panel = this.panel()?.nativeElement;
    if (!panel) return;
    const items = this.focusables();
    if (!items.length) { e.preventDefault(); panel.focus(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || !panel.contains(active))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
      e.preventDefault(); first.focus();
    }
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

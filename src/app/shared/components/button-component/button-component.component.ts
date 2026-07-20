import { CommonModule } from '@angular/common';
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
 
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';
 
@Component({
  selector: 'gp-button',
  imports: [CommonModule],
  templateUrl: './button-component.component.html',
  styleUrl: './button-component.component.css'
})
export class ButtonComponent {

  // ── Inputs (signal-based, Angular 19) ────────
  readonly variant  = input<ButtonVariant>('primary');
  readonly size     = input<ButtonSize>('md');
  readonly loading  = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly type     = input<'button' | 'submit' | 'reset'>('button');
 
  // ── Clases computadas para el host ───────────
  get hostClasses(): string {
    return [
      'btn',
      `btn--${this.variant()}`,
      `btn--${this.size()}`,
      this.loading()  ? 'btn--loading'    : '',
      this.disabled() ? 'btn--disabled'   : '',
      this.fullWidth() ? 'btn--full-width' : '',
    ].filter(Boolean).join(' ');
  }
 
  get isDisabled(): boolean {
    return this.disabled() || this.loading();
  }
}

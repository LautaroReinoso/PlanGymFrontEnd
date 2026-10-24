// ─────────────────────────────────────────────
// GymPlan — IconButtonComponent
// Botón para acciones representadas por un ícono.
// ─────────────────────────────────────────────

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconButtonVariant =
  | 'ghost'
  | 'primary'
  | 'danger';

export type IconButtonSize =
  | 'sm'
  | 'md'
  | 'lg';

export type IconButtonIcon =
  | 'edit'
  | 'delete'
  | 'add'
  | 'close'
  | 'search'
  | 'arrow-left'
  | 'arrow-right'
  | 'settings'
  | 'more'
  | 'lines'
  | 'pesa'
  |  'day'
  | 'person';

@Component({
  selector: 'gp-icon-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {

  readonly icon = input.required<IconButtonIcon>();

  readonly variant = input<IconButtonVariant>('ghost');

  readonly size = input<IconButtonSize>('md');

  readonly disabled = input(false);

  readonly ariaLabel = input('');

  readonly clicked = output<void>();

  readonly bordered = input(true);

  readonly hostClasses = computed(() => [
    'icon-btn',
    `icon-btn--${this.variant()}`,
    `icon-btn--${this.size()}`,
    this.disabled() ? 'icon-btn--disabled' : '',
  ].filter(Boolean).join(' '));

  onClick(): void {
    if (this.disabled()) return;
    this.clicked.emit();
  }

}
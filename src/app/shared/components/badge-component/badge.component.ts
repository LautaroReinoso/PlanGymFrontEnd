// ─────────────────────────────────────────────
//  GymPlan — BadgeComponent
//  Tags de estado para la app de gym.
//  Variantes semánticas alineadas al dominio.
// ─────────────────────────────────────────────

import {
  Component,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Variantes semánticas del dominio GymPlan
export type BadgeVariant =
  | 'default'     
  | 'elevated'
  | 'flat'
  | 'accent';

export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'gp-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {

  readonly variant = input<BadgeVariant>('default');
  readonly size    = input<BadgeSize>('md');
  readonly dot     = input<boolean>(false); // muestra un punto de color antes del texto

  get hostClasses(): string {
    return [
      'badge',
      `badge--${this.variant()}`,
      `badge--${this.size()}`,
      this.dot() ? 'badge--dot' : '',
    ].filter(Boolean).join(' ');
  }
}
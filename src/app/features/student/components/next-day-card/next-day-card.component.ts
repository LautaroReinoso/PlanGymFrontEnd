// ─────────────────────────────────────────────
//  PlanGym — app-next-day-card (Student)
//  Tarjeta destacada del Inicio: el siguiente día pendiente de la semana.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-next-day-card',
  standalone: true,
  templateUrl: './next-day-card.component.html',
  styleUrl: './next-day-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextDayCardComponent {
  /** Número de día en el plan (1, 2, 3…) */
  readonly dayNumber     = input.required<number>();
  readonly name          = input.required<string>();
  readonly exerciseCount = input.required<number>();
  readonly start = output<void>();
}

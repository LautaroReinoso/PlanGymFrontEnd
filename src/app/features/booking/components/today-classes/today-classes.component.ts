// ─────────────────────────────────────────────
//  PlanGym — app-today-classes
//  Aviso compacto "Hoy tenés clase" (página del Día).
//  Solo muestra algo si el módulo está prendido y hay clase hoy.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentClassesService } from '../../services/student-classes.service';
import { Booking } from '../../models/booking.models';
import { isPast, isoTime, todayKey } from '../../utils/booking-date.util';

@Component({
  selector: 'app-today-classes',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (today().length) {
      <a class="tc" routerLink="/student/turnos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>Hoy tenés clase: <strong>{{ text() }}</strong></span>
      </a>
    }
  `,
  styles: [`
    .tc {
      display: flex; align-items: center; gap: var(--space-2); text-decoration: none;
      font-size: 14px; color: var(--color-text); padding: var(--space-3) var(--space-4);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-celeste); border-radius: var(--radius-sm);
    }
    .tc svg { width: 18px; height: 18px; color: var(--color-celeste); flex-shrink: 0; }
    .tc strong { font-weight: 600; }
    .tc__done { color: var(--color-muted-light); }
  `],
})
export class TodayClassesComponent {
  private readonly classes = inject(StudentClassesService);
  readonly today = signal<Booking[]>([]);
  /** "Funcional 18:00 y Musculación 20:00 (ya pasó)" */
  readonly text = computed(() => {
    const parts = this.today().map(b =>
      `${b.serviceName} ${isoTime(b.startAt)}${isPast(b.endAt) ? ' (ya pasó)' : ''}`);
    return parts.length <= 1 ? parts.join('') : parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
  });

  constructor() {
    const k = todayKey();
    this.classes.classesIn({ from: k, to: k }).subscribe(list => this.today.set(list));
  }
}

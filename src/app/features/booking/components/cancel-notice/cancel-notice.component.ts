// ─────────────────────────────────────────────
//  PlanGym — app-cancel-notice (layout del alumno)
//  Popup: "Tu profe canceló el encuentro del … Podés recuperarla".
//  Se muestra una sola vez por clase (ids vistos en localStorage).
//  Depende de Booking.cancelledBy === 'PROFESSIONAL' (backend): si el
//  campo todavía no viene, no aparece nada.
// ─────────────────────────────────────────────

import { plus30 } from '../../utils/recovery.util';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { StudentClassesService } from '../../services/student-classes.service';
import { BookingStudentService } from '../../services/booking-student.service';
import { Booking } from '../../models/booking.models';
import { addDays, isPast, isoDateKey, isoTime, longDate, todayKey } from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { catchError, of, switchMap } from 'rxjs';

const SEEN_KEY = 'pg.student.seenCancelNotices';

function loadSeen(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')); } catch { return new Set(); }
}
function saveSeen(ids: Set<number>): void {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200))); } catch { /* sin storage */ }
}

@Component({
  selector: 'app-cancel-notice',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <gp-modal [isOpen]="pending().length > 0" [title]="pending().length > 1 ? 'Tu profe canceló encuentros' : 'Tu profe canceló un encuentro'"
              size="sm" (closed)="dismiss()">
      <div class="cn">
        @for (b of pending(); track b.id) {
          <div class="cn__item">
            <strong>{{ b.serviceName }} · {{ when(b) }}</strong>
            @if (b.cancelReason) { <span class="cn__reason">“{{ b.cancelReason }}”</span> }
            @if (b.grantsRecovery !== false) { <span class="cn__reason">La podés recuperar hasta el {{ until(b) }}.</span> }
          </div>
        }
        @if (anyRecovery()) {
          <p class="cn__text">Podés recuperar {{ pending().length > 1 ? 'esas clases' : 'esa clase' }} en cualquier horario con lugar, hasta 30 días después.</p>
        }
        <div class="cn__actions">
          @if (anyRecovery()) {
            <gp-button (click)="goRecover()">Elegir horario</gp-button>
          }
          <gp-button variant="ghost" (click)="dismiss()">Entendido</gp-button>
        </div>
      </div>
    </gp-modal>
  `,
  styles: [`
    .cn { display: flex; flex-direction: column; gap: var(--space-3); }
    .cn__item { display: flex; flex-direction: column; gap: 2px; padding: var(--space-3);
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-left: 3px solid var(--color-warning); border-radius: var(--radius-sm); color: var(--color-text); }
    .cn__reason { font-size: 13px; color: var(--color-muted-light); }
    .cn__text { margin: 0; font-size: 14px; color: var(--color-text); }
    .cn__actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  `],
})
export class CancelNoticeComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly classes = inject(StudentClassesService);
  private readonly api = inject(BookingStudentService);
  private readonly router = inject(Router);

  readonly pending = signal<Booking[]>([]);
  readonly anyRecovery = computed(() => this.pending().some(b => b.grantsRecovery !== false));

  constructor() {
    this.classes.init();
    const today = todayKey();
    // Cancelaciones del profe en clases que todavía no pasaron (o de hoy)
    this.classes.ready().pipe(
      switchMap(ok => ok ? this.api.myBookings({ from: addDays(today, -1), to: addDays(today, 30) }) : of([] as Booking[])),
      catchError(() => of([] as Booking[])),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(list => {
      const seen = loadSeen();
      this.pending.set(list
        .filter(b => b.status === 'CANCELLED' && b.cancelledBy === 'PROFESSIONAL' && !seen.has(b.id) && !isPast(b.endAt))
        .sort((a, b) => a.startAt.localeCompare(b.startAt)));
    });
  }

  until(b: Booking): string { return plus30(b.startAt); }

  when(b: Booking): string { return `${longDate(isoDateKey(b.startAt))}, ${isoTime(b.startAt)}`; }

  dismiss(): void {
    const seen = loadSeen();
    this.pending().forEach(b => seen.add(b.id));
    saveSeen(seen);
    this.pending.set([]);
  }

  goRecover(): void {
    this.dismiss();
    this.router.navigate(['/student/turnos']);
  }
}

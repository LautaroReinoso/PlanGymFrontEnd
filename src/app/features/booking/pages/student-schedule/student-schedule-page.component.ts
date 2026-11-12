// ─────────────────────────────────────────────
//  PlanGym — StudentSchedulePage (/student/turnos/horarios)
//  Horarios de su entrenador día por día (con cupo, incluidos completos)
//  y "Recuperar" en un horario con lugar antes de que venza (30 días desde la clase).
//  Recuperar: avisó a tiempo que no iba → gana 1 clase para usar ese mes
//  (tope por mes que pone el entrenador). Se recupera en cualquier servicio.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { absenceCapNotice, ddmm, expiresSoon, latestRecoveryDeadline, pendingRecoveries, withinRecoveryWindow } from '../../utils/recovery.util';

import { BookingStudentService } from '../../services/booking-student.service';
import { RecoverySummary, ScheduleSlot } from '../../models/booking.models';
import {
  DAY_SHORT, addDays, fromKey, isPast, isoDateKey, isoDow, isoTime, longDate, shortDate, todayKey,
} from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

/** Días que se muestran en la tira (el backend acepta hasta 42) */
const DAYS_AHEAD = 21;
/** Máximo que acepta GET /schedule (y el plazo de 30 días de una recuperación entra) */
const MAX_DAYS = 42;

interface DayTab { key: string; dow: string; num: number; count: number; free: number; }

@Component({
  selector: 'app-student-schedule-page',
  standalone: true,
  imports: [RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './student-schedule-page.component.html',
  styleUrl: './student-schedule-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSchedulePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(BookingStudentService);
  private readonly toast = inject(ToastService);

  readonly isoTime = isoTime;
  readonly today = todayKey();

  readonly slots     = signal<ScheduleSlot[]>([]);
  readonly summary   = signal<RecoverySummary | null>(null);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);
  readonly selected  = signal(todayKey());

  readonly chosen    = signal<ScheduleSlot | null>(null);
  readonly isSaving  = signal(false);

  readonly days = computed<DayTab[]>(() => {
    const byDay = new Map<string, ScheduleSlot[]>();
    for (const s of this.slots()) {
      const k = isoDateKey(s.startAt);
      byDay.set(k, [...(byDay.get(k) ?? []), s]);
    }
    return Array.from({ length: this.daysAhead() }, (_, i) => {
      const key = addDays(this.today, i);
      const list = (byDay.get(key) ?? []).filter(s => !isPast(s.endAt));
      return {
        key, dow: i === 0 ? 'Hoy' : DAY_SHORT[isoDow(key)], num: fromKey(key).getDate(),
        count: list.length, free: list.filter(s => s.free > 0 && !s.myBookingId).length,
      };
    });
  });

  readonly daySlots = computed(() =>
    this.slots().filter(s => isoDateKey(s.startAt) === this.selected() && !isPast(s.endAt)));

  readonly dayTitle = computed(() =>
    this.selected() === this.today ? `Hoy, ${longDate(this.selected()).toLowerCase()}` : longDate(this.selected()));

  /** Días que muestra la tira: 21, o hasta el vencimiento más lejano (tope 42) para poder pasar al mes siguiente. */
  readonly daysAhead = signal(DAYS_AHEAD);

  /** "dd/MM" del vencimiento más próximo y del más lejano */
  readonly earliestExpiry = computed(() => ddmm(this.summary()?.expiresAt));
  readonly latestDeadline = computed(() => latestRecoveryDeadline(this.summary()));

  readonly recoveryEnabled = computed(() => (this.summary()?.limit ?? 0) > 0 || (this.summary()?.available ?? 0) > 0);
  readonly available = computed(() => this.summary()?.available ?? 0);
  /** Recuperaciones pendientes (no usadas, no vencidas), la que vence antes primero */
  readonly pendingItems = computed(() => pendingRecoveries(this.summary()));
  readonly ddmm = ddmm;
  readonly capNotice = computed(() => absenceCapNotice(this.summary(), todayKey()));
  readonly expiresSoon = expiresSoon;

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    // Primero el resumen: el vencimiento más lejano define hasta dónde pedir horarios.
    this.api.recoveries().pipe(
      catchError(() => of(null)),
      switchMap(summary => {
        const last = latestRecoveryDeadline(summary);
        let n = DAYS_AHEAD;
        if (last && (summary?.available ?? 0) > 0) {
          const diff = Math.ceil((fromKey(isoDateKey(last)).getTime() - fromKey(this.today).getTime()) / 86_400_000) + 1;
          n = Math.min(MAX_DAYS, Math.max(DAYS_AHEAD, diff));
        }
        this.daysAhead.set(n);
        return forkJoin({
          slots: this.api.schedule({ from: this.today, to: addDays(this.today, n - 1) }),
          summary: of(summary),
        });
      }),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ slots, summary }) => {
        this.slots.set(slots);
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(apiErrorText(err, 'No se pudieron cargar los horarios.'));
        this.isLoading.set(false);
      },
    });
  }

  /** Estado de una franja para el alumno */
  stateOf(s: ScheduleSlot): 'mine' | 'full' | 'expired' | 'recover' | 'free' {
    if (s.myBookingId) return 'mine';
    if (s.free <= 0) return 'full';
    if (this.available() <= 0) return 'free';
    return withinRecoveryWindow(this.summary(), s.startAt) ? 'recover' : 'expired';
  }

  pick(s: ScheduleSlot): void {
    if (this.stateOf(s) === 'recover') this.chosen.set(s);
  }

  missedLabel(startAt: string, serviceName: string): string {
    return `${serviceName} del ${shortDate(isoDateKey(startAt))} ${isoTime(startAt)}`;
  }

  chosenLabel(s: ScheduleSlot): string {
    return `${longDate(isoDateKey(s.startAt))}, ${isoTime(s.startAt)} a ${isoTime(s.endAt)}`;
  }

  confirm(): void {
    const s = this.chosen();
    if (!s) return;
    this.isSaving.set(true);
    this.api.recover({ serviceId: s.serviceId, professionalId: s.professionalId, startAt: s.startAt }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.chosen.set(null);
        this.toast.success('¡Listo! Ya estás anotado para recuperar.');
        this.load();
      },
      error: err => {
        this.isSaving.set(false);
        this.chosen.set(null);
        this.toast.error(apiErrorText(err));
        this.load();
      },
    });
  }
}

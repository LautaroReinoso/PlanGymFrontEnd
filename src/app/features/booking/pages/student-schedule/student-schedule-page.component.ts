// ─────────────────────────────────────────────
//  PlanGym — StudentSchedulePage (/student/turnos/horarios)
//  Horarios de su entrenador día por día (con cupo, incluidos completos)
//  y "Recuperar" en un horario con lugar del mismo mes.
//  Recuperar: avisó a tiempo que no iba → gana 1 clase para usar ese mes
//  (tope por mes que pone el entrenador). Se recupera en cualquier servicio.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

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
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
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

  /** "30 de noviembre" (último día para recuperar) */
  readonly deadline = computed(() => {
    const s = this.summary();
    if (!s?.expiresAt) return '';
    const last = addDays(isoDateKey(s.expiresAt), -1);
    return longDate(last).split(' ').slice(1).join(' ');
  });

  readonly recoveryEnabled = computed(() => (this.summary()?.limit ?? 0) > 0);
  readonly available = computed(() => this.summary()?.available ?? 0);
  /** Recuperaciones pendientes con el detalle de qué clase faltó */
  readonly pendingItems = computed(() => (this.summary()?.items ?? []).filter(i => !i.recoveredByBookingId));

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    forkJoin({
      slots: this.api.schedule({ from: this.today, to: addDays(this.today, DAYS_AHEAD - 1) }),
      summary: this.api.recoveries().pipe(catchError(() => of(null))),
    }).subscribe({
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
  stateOf(s: ScheduleSlot): 'mine' | 'full' | 'otherMonth' | 'recover' | 'free' {
    if (s.myBookingId) return 'mine';
    if (s.free <= 0) return 'full';
    const month = this.summary()?.month;
    if (month && !s.startAt.startsWith(month)) return 'otherMonth';
    return this.recoveryEnabled() && this.available() > 0 ? 'recover' : 'free';
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
    this.api.recover({ serviceId: s.serviceId, professionalId: s.professionalId, startAt: s.startAt }).subscribe({
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

// ─────────────────────────────────────────────
//  GymPlan — WeeklyPageComponent (Student)
//  Estado de la semana (lunes a domingo) calculado por el backend
//  a partir de los WorkoutLog. La página no guarda estado propio:
//  lee WeekStatusService.week y navega entre semanas pidiendo
//  otra fecha.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { WeekStatusService } from '../../services/week-status.service';
import { WeekDayStatus } from '../../models/student.models';
import { MONTH_NAMES, WEEKDAY_SHORT, addDays, fromIsoDate, toIsoDate } from '../../utils/progress.util';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { RouterLink } from '@angular/router';
import { StudentClassesService } from '../../../booking/services/student-classes.service';
import { Booking } from '../../../booking/models/booking.models';
import { isPast, isoDateKey, isoTime, shortDate } from '../../../booking/utils/booking-date.util';

interface WeekCell {
  iso: string;
  label: string;
  dayNumber: number;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
  /** horas de clase (turnos) de ese día */
  classTimes: string[];
}

import { NextDayCardComponent } from '../../components/next-day-card/next-day-card.component';

@Component({
  selector: 'app-weekly-page',
  standalone: true,
  imports: [NextDayCardComponent, PageLoaderComponent, CommonModule, ButtonComponent, RouterLink],
  templateUrl: './weekly-page.component.html',
  styleUrls: ['../student-pages.css', './weekly-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly weekService = inject(WeekStatusService);
  private readonly router = inject(Router);

  readonly week      = this.weekService.week;
  readonly days      = this.weekService.days;
  readonly percent   = this.weekService.percent;
  readonly nextDay   = this.weekService.nextDay;
  readonly isLoading = this.weekService.isLoading;
  readonly error     = signal<string | null>(null);
  readonly noPlan    = signal(false);

  // ── Turnos de la semana mostrada ──
  readonly classesSvc = inject(StudentClassesService);
  readonly weekClasses = signal<Booking[]>([]);
  readonly classRows = computed(() => this.weekClasses().map(b => ({
    id: b.id,
    day: shortDate(isoDateKey(b.startAt)),
    time: isoTime(b.startAt),
    what: b.serviceName,
    past: isPast(b.endAt) || b.status !== 'CONFIRMED',
  })));
  private readonly classesByDay = computed(() => {
    const m = new Map<string, string[]>();
    for (const b of this.weekClasses()) {
      const k = isoDateKey(b.startAt);
      m.set(k, [...(m.get(k) ?? []), isoTime(b.startAt)]);
    }
    return m;
  });

  constructor() {
    // Cada vez que cambia la semana mostrada, traer sus clases (cache 60 s)
    effect(() => {
      const w = this.week();
      if (!w) return;
      untracked(() => this.classesSvc.classesIn({ from: w.weekStart, to: w.weekEnd })
        .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(list => this.weekClasses.set(list)));
    });
  }

  readonly isCurrentWeek = computed(() => this.week()?.currentWeek ?? true);

  readonly rangeLabel = computed(() => {
    const w = this.week();
    if (!w) return '';
    const a = fromIsoDate(w.weekStart);
    const b = fromIsoDate(w.weekEnd);
    const ma = MONTH_NAMES[a.getMonth()].slice(0, 3).toLowerCase();
    const mb = MONTH_NAMES[b.getMonth()].slice(0, 3).toLowerCase();
    return ma === mb ? `${a.getDate()}–${b.getDate()} ${mb}` : `${a.getDate()} ${ma} – ${b.getDate()} ${mb}`;
  });

  readonly weekLabel = computed(() => {
    const w = this.week();
    if (!w?.weekNumber) return null;
    return w.durationWeeks ? `Semana ${w.weekNumber} de ${w.durationWeeks}` : `Semana ${w.weekNumber}`;
  });

  /** Tira lun–dom: marca las fechas en que entrenó algún día del plan */
  readonly cells = computed<WeekCell[]>(() => {
    const w = this.week();
    if (!w) return [];
    const trainedDates = new Set(w.days.filter(d => d.completedAt).map(d => d.completedAt!));
    const monday = fromIsoDate(w.weekStart);
    return WEEKDAY_SHORT.map((label, i) => {
      const d = addDays(monday, i);
      const iso = toIsoDate(d);
      return {
        iso, label, dayNumber: d.getDate(),
        trained: trainedDates.has(iso), isToday: iso === w.today, isFuture: iso > w.today,
        classTimes: this.classesByDay().get(iso) ?? [],
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(date?: string): void {
    this.error.set(null);
    this.noPlan.set(false);
    this.weekService.load(date).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (err) => {
        if (err?.status === 404) this.noPlan.set(true);
        else this.error.set('No pudimos cargar tu semana. Intentá nuevamente.');
      },
    });
  }

  prevWeek(): void {
    const w = this.week();
    if (w) this.load(toIsoDate(addDays(fromIsoDate(w.weekStart), -7)));
  }

  nextWeek(): void {
    const w = this.week();
    if (w && !w.currentWeek) this.load(toIsoDate(addDays(fromIsoDate(w.weekStart), 7)));
  }

  doneLabel(day: WeekDayStatus): string | null {
    if (!day.done || !day.completedAt) return null;
    const d = fromIsoDate(day.completedAt);
    const base = `Hecho el ${WEEKDAY_SHORT[(d.getDay() + 6) % 7].toLowerCase()} ${d.getDate()}`;
    return day.timesDone > 1 ? `${base} · ${day.timesDone} veces` : base;
  }

  openDay(day: WeekDayStatus): void {
    this.router.navigate(['/student/day', day.workoutDayId]);
  }
}

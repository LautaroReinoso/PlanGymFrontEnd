// ─────────────────────────────────────────────
//  GymPlan — WeeklyPageComponent (Student)
//  Estado de la semana (lunes a domingo) calculado por el backend
//  a partir de los WorkoutLog. La página no guarda estado propio:
//  lee WeekStatusService.week y navega entre semanas pidiendo
//  otra fecha.
// ─────────────────────────────────────────────

import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { WeekStatusService } from '../../services/week-status.service';
import { WeekDayStatus } from '../../models/student.models';
import { MONTH_NAMES, WEEKDAY_SHORT, addDays, fromIsoDate, toIsoDate } from '../../utils/progress.util';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';

interface WeekCell {
  iso: string;
  label: string;
  dayNumber: number;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-weekly-page',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, ButtonComponent],
  templateUrl: './weekly-page.component.html',
  styleUrl: './weekly-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyPageComponent implements OnInit {
  private readonly weekService = inject(WeekStatusService);
  private readonly router = inject(Router);

  readonly week      = this.weekService.week;
  readonly days      = this.weekService.days;
  readonly percent   = this.weekService.percent;
  readonly nextDay   = this.weekService.nextDay;
  readonly isLoading = this.weekService.isLoading;
  readonly error     = signal<string | null>(null);
  readonly noPlan    = signal(false);

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
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(date?: string): void {
    this.error.set(null);
    this.noPlan.set(false);
    this.weekService.load(date).subscribe({
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

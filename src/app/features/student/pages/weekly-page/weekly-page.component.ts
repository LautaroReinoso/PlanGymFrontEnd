// ─────────────────────────────────────────────
//  GymPlan — WeeklyPageComponent (Student)
//  La semana (lunes a domingo): qué días entrenó, cuántos
//  días del plan lleva y cuál le toca. Navega entre semanas.
// ─────────────────────────────────────────────

import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { StudentProgress, StudentProgressService } from '../../services/student-progress.service';
import { WorkoutTemplateDay } from '../../../trainer/models/trainer.models';
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  addDays,
  logsBetween,
  logsByDate,
  nextSuggestedDay,
  startOfWeek,
  toIsoDate,
  todayIso,
} from '../../utils/progress.util';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

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
  imports: [CommonModule, SkeletonComponent, ButtonComponent],
  templateUrl: './weekly-page.component.html',
  styleUrl: './weekly-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyPageComponent implements OnInit {
  private readonly progressService = inject(StudentProgressService);
  private readonly router = inject(Router);

  readonly progress  = signal<StudentProgress | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);

  /** 0 = esta semana, -1 = la anterior… */
  readonly weekOffset = signal(0);

  readonly monday = computed(() => addDays(startOfWeek(new Date()), this.weekOffset() * 7));
  readonly fromIso = computed(() => toIsoDate(this.monday()));
  readonly toIso   = computed(() => toIsoDate(addDays(this.monday(), 6)));
  readonly isCurrentWeek = computed(() => this.weekOffset() === 0);

  readonly rangeLabel = computed(() => {
    const a = this.monday();
    const b = addDays(a, 6);
    const ma = MONTH_NAMES[a.getMonth()].slice(0, 3).toLowerCase();
    const mb = MONTH_NAMES[b.getMonth()].slice(0, 3).toLowerCase();
    return ma === mb ? `${a.getDate()}–${b.getDate()} ${mb}` : `${a.getDate()} ${ma} – ${b.getDate()} ${mb}`;
  });

  readonly cells = computed<WeekCell[]>(() => {
    const byDate = logsByDate(this.progress()?.logs ?? []);
    const today = todayIso();
    return WEEKDAY_SHORT.map((label, i) => {
      const d = addDays(this.monday(), i);
      const iso = toIsoDate(d);
      return {
        iso, label, dayNumber: d.getDate(),
        trained: byDate.has(iso), isToday: iso === today, isFuture: iso > today,
      };
    });
  });

  private readonly weekLogs = computed(() =>
    logsBetween(this.progress()?.logs ?? [], this.fromIso(), this.toIso()));

  /** workoutDayId → fecha en que lo hizo esta semana */
  readonly doneThisWeek = computed(() => {
    const m = new Map<number, string>();
    for (const l of this.weekLogs()) if (!m.has(l.workoutDayId)) m.set(l.workoutDayId, l.completedAt.slice(0, 10));
    return m;
  });

  readonly days = computed(() => this.progress()?.days ?? []);
  readonly doneCount = computed(() => this.days().filter(d => this.doneThisWeek().has(d.workoutDayId)).length);
  readonly percent = computed(() =>
    this.days().length ? Math.round((this.doneCount() / this.days().length) * 100) : 0);

  readonly nextDay = computed(() =>
    this.isCurrentWeek() ? nextSuggestedDay(this.days(), this.progress()?.logs ?? []) : null);

  readonly hasPlan = computed(() => !!this.progress()?.detail.summary.activeWorkout);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.progressService.getProgress().subscribe({
      next: p => { this.progress.set(p); this.isLoading.set(false); },
      error: () => {
        this.error.set('No pudimos cargar tu semana. Intentá nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  prevWeek(): void { this.weekOffset.update(n => n - 1); }
  nextWeek(): void { if (this.weekOffset() < 0) this.weekOffset.update(n => n + 1); }

  doneLabel(day: WorkoutTemplateDay): string | null {
    const iso = this.doneThisWeek().get(day.workoutDayId);
    if (!iso) return null;
    const cell = this.cells().find(c => c.iso === iso);
    return cell ? `Hecho el ${cell.label.toLowerCase()} ${cell.dayNumber}` : 'Hecho';
  }

  openDay(day: WorkoutTemplateDay): void {
    this.router.navigate(['/student/day', day.workoutDayId]);
  }
}

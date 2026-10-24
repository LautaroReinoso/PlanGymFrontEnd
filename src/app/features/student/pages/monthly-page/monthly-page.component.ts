// ─────────────────────────────────────────────
//  GymPlan — MonthlyPageComponent (Student)
//  Calendario del mes con los días entrenados
//  (GET /workout-logs/my-history), racha y adherencia.
// ─────────────────────────────────────────────

import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StudentProgress, StudentProgressService } from '../../services/student-progress.service';
import { WorkoutLogResponse } from '../../models/student.models';
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  fromIsoDate,
  logsByDate,
  toIsoDate,
  todayIso,
  weekStreak,
} from '../../utils/progress.util';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-monthly-page',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, ButtonComponent],
  templateUrl: './monthly-page.component.html',
  styleUrl: './monthly-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyPageComponent implements OnInit {
  private readonly progressService = inject(StudentProgressService);

  readonly progress  = signal<StudentProgress | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);

  readonly weekdays = WEEKDAY_SHORT;

  /** Primer día del mes que se está viendo */
  readonly month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly selectedIso = signal<string | null>(null);

  readonly isCurrentMonth = computed(() => {
    const now = new Date();
    return this.month().getFullYear() === now.getFullYear() && this.month().getMonth() === now.getMonth();
  });

  readonly title = computed(() => `${MONTH_NAMES[this.month().getMonth()]} ${this.month().getFullYear()}`);

  private readonly byDate = computed(() => logsByDate(this.progress()?.logs ?? []));

  /** Grilla de 6 semanas (lunes primero), con días del mes anterior/siguiente atenuados */
  readonly cells = computed<CalendarCell[]>(() => {
    const first = this.month();
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((offset + daysInMonth) / 7);
    const today = todayIso();
    const out: CalendarCell[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = toIsoDate(d);
      out.push({
        iso, day: d.getDate(),
        inMonth: d.getMonth() === first.getMonth(),
        trained: this.byDate().has(iso),
        isToday: iso === today,
        isFuture: iso > today,
      });
    }
    return out;
  });

  readonly trainedThisMonth = computed(() => this.cells().filter(c => c.inMonth && c.trained).length);
  readonly streak = computed(() => weekStreak(this.progress()?.logs ?? []));
  readonly adherence = computed(() => this.progress()?.detail.summary.adherencePercent ?? null);

  readonly selectedLogs = computed<WorkoutLogResponse[]>(() => {
    const iso = this.selectedIso();
    return iso ? this.byDate().get(iso) ?? [] : [];
  });

  readonly selectedLabel = computed(() => {
    const iso = this.selectedIso();
    if (!iso) return '';
    const d = fromIsoDate(iso);
    return `${WEEKDAY_SHORT[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.progressService.getProgress().subscribe({
      next: p => { this.progress.set(p); this.isLoading.set(false); },
      error: () => {
        this.error.set('No pudimos cargar tu historial. Intentá nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  prevMonth(): void {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
    this.selectedIso.set(null);
  }

  nextMonth(): void {
    if (this.isCurrentMonth()) return;
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
    this.selectedIso.set(null);
  }

  select(cell: CalendarCell): void {
    if (!cell.inMonth || cell.isFuture) return;
    this.selectedIso.set(this.selectedIso() === cell.iso ? null : cell.iso);
  }
}

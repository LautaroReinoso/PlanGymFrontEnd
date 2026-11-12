// ─────────────────────────────────────────────
//  GymPlan — DashboardPageComponent (Student)
//  Punto de entrada del Student: plan activo y lista de
//  días. El alumno ELIGE el día que va a entrenar
//  (no se resuelve "el de hoy" por día de la semana).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { StudentWorkoutService } from '../../services/student-workout.service';
import { StudentWorkoutDetail } from '../../models/student.models';
import { WorkoutTemplateDay } from '../../../trainer/models/trainer.models';
import { BadgeComponent } from '../../../../shared/components/badge-component/badge.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { apiErrorText } from '../../../../core/http/api-error.util';
import { StudentClassesService } from '../../../booking/services/student-classes.service';
import { NextClassCardComponent } from '../../../booking/components/next-class/next-class-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { NextDayCardComponent } from '../../components/next-day-card/next-day-card.component';
import { WeekStatusService } from '../../services/week-status.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NextDayCardComponent, EmptyStateComponent, NextClassCardComponent, PageLoaderComponent, CommonModule, RouterLink, BadgeComponent, ButtonComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  private readonly workoutService = inject(StudentWorkoutService);
  private readonly router         = inject(Router);

  /** Turnos: prendido → tarjeta de próxima clase */
  readonly classes = inject(StudentClassesService);

  // ── Estado ────────────────────────────────────
  readonly detail    = signal<StudentWorkoutDetail | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);

  readonly firstName = computed(() => {
    const name = this.detail()?.summary.studentName;
    return name ? name.split(' ')[0] : null;
  });

  readonly adherencePercent = computed(() => this.detail()?.summary.adherencePercent ?? null);

  readonly hasActivePlan = computed(() => !!this.detail()?.summary.activeWorkout);
  readonly activeWorkout = computed(() => this.detail()?.summary.activeWorkout ?? null);

  // ── Derivados ─────────────────────────────────

  /** Días del plan en el orden que armó el entrenador */
  readonly days = computed<WorkoutTemplateDay[]>(() =>
    [...(this.detail()?.template?.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
  );

  readonly skeletons = Array(3).fill(0);

  /** Estado de la semana (mismo servicio que Semana y "Hoy"): solo para destacar el día siguiente */
  readonly week = inject(WeekStatusService);
  readonly weekLoaded = signal(false);
  private readonly weekFailed = signal(false);

  /**
   * Día destacado = el primer día pendiente de la semana (lo mismo que usa "Hoy").
   * Si la semana no se pudo cargar, el Día 1. Si hizo todos, ninguno.
   */
  readonly nextDay = computed<{ day: WorkoutTemplateDay; index: number } | null>(() => {
    const days = this.days();
    if (!days.length) return null;
    if (this.weekFailed()) return { day: days[0], index: 0 };
    if (!this.weekLoaded()) return null;
    const next = this.week.nextDay();
    const i = next ? days.findIndex(d => d.workoutDayId === next.workoutDayId) : -1;
    return i >= 0 ? { day: days[i], index: i } : null;
  });

  isDone(day: WorkoutTemplateDay): boolean {
    return !!this.week.week()?.currentWeek && !!this.week.days().find(d => d.workoutDayId === day.workoutDayId)?.done;
  }

  ngOnInit(): void {
    this.classes.init();
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.workoutService.getMyWorkoutDetail().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.isLoading.set(false);
        if (detail?.summary.activeWorkout) this.loadWeek();
      },
      error: err => {
        // 404 = no tiene rutina asignada: no es un error, es el estado "sin plan"
        if (err?.status === 404) {
          this.detail.set(null);
          this.isLoading.set(false);
          return;
        }
        // Mostrar el motivo real del backend (403 sin suscripción, 500, sin conexión…)
        this.error.set(apiErrorText(err, 'No pudimos cargar tu entrenamiento. Intentá nuevamente.'));
        this.isLoading.set(false);
      },
    });
  }

  private loadWeek(): void {
    this.weekLoaded.set(false);
    this.weekFailed.set(false);
    this.week.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.weekLoaded.set(true),
      error: () => this.weekFailed.set(true),
    });
  }

  openDay(day: WorkoutTemplateDay): void {
    this.router.navigate(['/student/day', day.workoutDayId]);
  }
  readonly needsProfile = computed(() => {
  const w = this.detail()?.summary; // ajustá al nombre de tu signal
  return !!w && !w.studentName?.trim();
});

}

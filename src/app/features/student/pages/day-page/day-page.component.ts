// ─────────────────────────────────────────────
//  GymPlan — DayPageComponent (Student)
//  Muestra UN día del plan, elegido por el alumno desde
//  el Dashboard (/student/day/:workoutDayId).
//
//  Los ejercicios se listan con <app-exercise-item>, el mismo
//  componente que usa Trainer (movido a shared/), y al tocar uno
//  se abre <app-exercise-detail> —también compartido con
//  Trainer— dentro de un gp-modal, sin salir de esta pantalla.
// ─────────────────────────────────────────────

import { ExerciseDetail } from '../../../trainer/models/trainer.models';
import { TodayClassesComponent } from '../../../booking/components/today-classes/today-classes.component';
import { dayExerciseSummary } from '../../../trainer/models/exercise-meta.util';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { StudentWorkoutService } from '../../services/student-workout.service';
import { WeekStatusService } from '../../services/week-status.service';
import { StudentDayResponse } from '../../models/student.models';
import { DayExercise } from '../../../trainer/models/trainer.models';

import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ExerciseItemComponent } from '../../../../shared/components/exercise-item/exercise-item.component';
import {
  ExerciseDetailComponent,
  ExerciseDetailViewModel,
} from '../../../../shared/components/exercise-detail/exercise-detail.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-day-page',
  standalone: true,
  imports: [PageLoaderComponent, TodayClassesComponent, 
    CommonModule,
    ButtonComponent,
    ModalComponent,
    ExerciseItemComponent,
    ExerciseDetailComponent,
  ],
  templateUrl: './day-page.component.html',
  styleUrl: './day-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  private readonly workoutService = inject(StudentWorkoutService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly weekService    = inject(WeekStatusService);

  // ── Estado ────────────────────────────────────
  readonly data      = signal<StudentDayResponse | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly notFound  = signal(false);

  // Registro del día: el estado vive en WeekStatusService (calculado por el backend)
  private readonly dayId = signal(0);
  readonly doneToday = computed(() => {
    this.weekService.week();                       // dependencia del signal
    return this.weekService.doneToday(this.dayId());
  });
  readonly isMarking = computed(() => this.weekService.pendingDayId() === this.dayId());
  readonly markError = signal<string | null>(null);

  // Ejercicio elegido: abre el detalle en un modal (mismo
  // ExerciseDetail que usa Trainer, sin salir del día)
  readonly selectedExercise = signal<DayExercise | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const workoutDayId = Number(this.route.snapshot.paramMap.get('workoutDayId'));

    if (!Number.isInteger(workoutDayId) || workoutDayId <= 0) {
      this.notFound.set(true);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.dayId.set(workoutDayId);
    // Siempre se pide la semana actual: es liviano y evita mostrar datos viejos
    // (p. ej. otro alumno que usó el mismo navegador antes).
    this.weekService.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => { /* el botón queda en "Marcar" */ } });

    this.workoutService.getMyWorkoutDay(workoutDayId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        // 404: el día no existe en su plan (o no tiene plan)
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('No pudimos cargar este entrenamiento. Intentá nuevamente.');
        }
        this.isLoading.set(false);
      },
    });
  }

  /** "3 series · 10 reps · 5kg · 60s" — mismo formato que usa Trainer en TemplateDay */
  detailText(ex: DayExercise): string {
    return dayExerciseSummary(ex);
  }

  /** Marca el día como hecho hoy. El backend devuelve la semana recalculada. */
  markAsDone(): void {
    if (this.doneToday() || this.isMarking()) return;
    this.markError.set(null);
    this.weekService.markDone(this.dayId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.markError.set('No pudimos registrar el entrenamiento. Probá de nuevo.'),
    });
  }

  /** Se equivocó: borra el registro de hoy de este día. */
  unmark(): void {
    if (!this.doneToday() || this.isMarking()) return;
    this.markError.set(null);
    this.weekService.unmark(this.dayId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.markError.set('No pudimos desmarcar el día. Probá de nuevo.'),
    });
  }

  /** Detalle completo (técnica, secundarios, video) — null mientras carga o si el backend no lo da */
  readonly fullDetail = signal<ExerciseDetail | null>(null);
  readonly loadingDetail = signal(false);
  private detailCache = new Map<number, ExerciseDetail>();

  openDetail(ex: DayExercise): void {
    this.selectedExercise.set(ex);
    const cached = this.detailCache.get(ex.exerciseId);
    this.fullDetail.set(cached ?? null);
    if (cached) return;
    this.loadingDetail.set(true);
    this.workoutService.exerciseDetail(ex.exerciseId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => {
        this.detailCache.set(ex.exerciseId, d);
        if (this.selectedExercise()?.exerciseId === ex.exerciseId) this.fullDetail.set(d);
        this.loadingDetail.set(false);
      },
      // Backend sin el endpoint (o 403/404): queda la vista mínima, sin error visible
      error: () => this.loadingDetail.set(false),
    });
  }

  closeDetail(): void {
    this.selectedExercise.set(null);
    this.fullDetail.set(null);
  }

  /**
   * Adapta un DayExercise (prescripción del día: series/reps/peso) al
   * shape que espera <app-exercise-detail> (info general del ejercicio).
   * StudentDayResponse no trae description/technique/equipment/laterality
   * ni global — no se inventan: esas secciones del detalle
   * simplemente no se muestran, igual que ya hacía ExerciseDetailPage
   * cuando el backend no las mandaba.
   */
  toDetailView(ex: DayExercise): ExerciseDetailViewModel {
    const d = this.fullDetail();
    // Los números son los de SU plan (lo que le indicó el entrenador), no los sugeridos del catálogo.
    const plan = {
      defaultSets: ex.sets,
      defaultRepsMin: ex.durationSeconds ? null : ex.reps,
      defaultRepsMax: ex.durationSeconds ? null : ex.repsMax ?? null,
      defaultRestSeconds: ex.restSeconds,
    };
    if (!d) {
      return { name: ex.exerciseName, primaryMuscle: ex.primaryMuscle, imageUrl: ex.imageUrl, difficulty: ex.difficulty, ...plan };
    }
    return {
      name: d.name,
      primaryMuscle: d.primaryMuscle,
      secondaryMuscles: d.secondaryMuscles,
      imageUrl: d.imageUrl ?? ex.imageUrl,
      videoUrl: d.videoUrl,
      difficulty: d.difficulty,
      description: d.description,
      techniqueSteps: d.techniqueSteps,
      exerciseType: d.exerciseType,
      equipment: d.equipment,
      laterality: d.laterality,
      parentExerciseName: d.parentExerciseName,
      ...plan,
      // sin `global`: el alumno no necesita el badge Global/Personal
    };
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }
}

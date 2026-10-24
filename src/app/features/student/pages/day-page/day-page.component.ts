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

import { dayExerciseSummary } from '../../../trainer/models/exercise-meta.util';
import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { StudentWorkoutService } from '../../services/student-workout.service';
import { WorkoutLogService } from '../../services/workout-log.service';
import { todayIso } from '../../utils/progress.util';
import { switchMap } from 'rxjs';
import { StudentDayResponse } from '../../models/student.models';
import { DayExercise } from '../../../trainer/models/trainer.models';

import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ExerciseItemComponent } from '../../../../shared/components/exercise-item/exercise-item.component';
import {
  ExerciseDetailComponent,
  ExerciseDetailViewModel,
} from '../../../../shared/components/exercise-detail/exercise-detail.component';

@Component({
  selector: 'app-day-page',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonComponent,
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

  private readonly workoutService = inject(StudentWorkoutService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly logService     = inject(WorkoutLogService);

  // ── Estado ────────────────────────────────────
  readonly data      = signal<StudentDayResponse | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly notFound  = signal(false);

  // Registro del día ("Marcar como hecho")
  readonly doneToday  = signal(false);
  readonly isMarking  = signal(false);
  readonly markError  = signal<string | null>(null);
  /** Id de la ruta (= WorkoutTemplateDay.workoutDayId), el mismo que espera WorkoutLog */
  private currentDayId = 0;

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

    this.currentDayId = workoutDayId;
    this.checkDoneToday(workoutDayId);

    this.workoutService.getMyWorkoutDay(workoutDayId).subscribe({
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

  /** ¿Ya registró este día hoy? (si el historial falla, se asume que no) */
  private checkDoneToday(workoutDayId: number): void {
    const today = todayIso();
    this.logService.getMyHistory().subscribe({
      next: logs => this.doneToday.set(
        logs.some(l => l.completed && l.workoutDayId === workoutDayId && l.completedAt.slice(0, 10) === today),
      ),
      error: () => this.doneToday.set(false),
    });
  }

  /** Registra el día como completado hoy (WorkoutLog a nivel día) */
  markAsDone(): void {
    const d = this.data();
    if (!d || this.doneToday() || this.isMarking()) return;

    this.isMarking.set(true);
    this.markError.set(null);
    this.workoutService.getMyWorkout().pipe(
      switchMap(summary => this.logService.register({
        studentId:    summary.studentId,
        workoutDayId: this.currentDayId,
        completedAt:  todayIso(),
        completed:    true,
      })),
    ).subscribe({
      next: () => {
        this.doneToday.set(true);
        this.isMarking.set(false);
      },
      error: () => {
        this.markError.set('No pudimos registrar el entrenamiento. Probá de nuevo.');
        this.isMarking.set(false);
      },
    });
  }

  openDetail(ex: DayExercise): void {
    this.selectedExercise.set(ex);
  }

  closeDetail(): void {
    this.selectedExercise.set(null);
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
    return {
      name: ex.exerciseName,
      primaryMuscle: ex.primaryMuscle,
      imageUrl: ex.imageUrl,
      difficulty: ex.difficulty,
    };
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }
}

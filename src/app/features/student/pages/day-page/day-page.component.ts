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
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
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
  imports: [PageLoaderComponent, 
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
    this.weekService.load().subscribe({ error: () => { /* el botón queda en "Marcar" */ } });

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

  /** Marca el día como hecho hoy. El backend devuelve la semana recalculada. */
  markAsDone(): void {
    if (this.doneToday() || this.isMarking()) return;
    this.markError.set(null);
    this.weekService.markDone(this.dayId()).subscribe({
      error: () => this.markError.set('No pudimos registrar el entrenamiento. Probá de nuevo.'),
    });
  }

  /** Se equivocó: borra el registro de hoy de este día. */
  unmark(): void {
    if (!this.doneToday() || this.isMarking()) return;
    this.markError.set(null);
    this.weekService.unmark(this.dayId()).subscribe({
      error: () => this.markError.set('No pudimos desmarcar el día. Probá de nuevo.'),
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

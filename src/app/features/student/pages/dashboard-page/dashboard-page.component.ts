// ─────────────────────────────────────────────
//  GymPlan — DashboardPageComponent (Student)
//  Punto de entrada del Student: plan activo y lista de
//  días. El alumno ELIGE el día que va a entrenar
//  (no se resuelve "el de hoy" por día de la semana).
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { StudentWorkoutService } from '../../services/student-workout.service';
import { StudentWorkoutDetail } from '../../models/student.models';
import { WorkoutTemplateDay } from '../../../trainer/models/trainer.models';
import { BadgeComponent } from '../../../../shared/components/badge-component/badge.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { apiErrorText } from '../../../../core/http/api-error.util';
import { BookingStudentService } from '../../../booking/services/booking-student.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, RouterLink, BadgeComponent, ButtonComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {

  private readonly workoutService = inject(StudentWorkoutService);
  private readonly bookingProbe   = inject(BookingStudentService);
  private readonly router         = inject(Router);

  /** Módulo de turnos prendido → tarjeta "Mis turnos" */
  readonly bookingEnabled = signal(false);

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

  ngOnInit(): void {
    this.bookingProbe.probe().subscribe(ok => this.bookingEnabled.set(ok));
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.workoutService.getMyWorkoutDetail().subscribe({
      next: detail => {
        this.detail.set(detail);
        this.isLoading.set(false);
      },
      error: err => {
        // Mostrar el motivo real del backend (403 sin suscripción, 500, sin conexión…)
        console.error('[Dashboard] my-workout falló', err);
        this.error.set(apiErrorText(err, 'No pudimos cargar tu entrenamiento. Intentá nuevamente.'));
        this.isLoading.set(false);
      },
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

// ─────────────────────────────────────────────
//  GymPlan — StudentWorkoutService
//  HTTP calls para el workout del Student autenticado.
//  - GET /api/student-workouts/my-workout        → resumen (sin días)
//  - GET /api/student-workouts/my-workout/days   → WorkoutTemplateDetailResponse
//    (endpoint STUDENT-safe agregado en backend; no pasa por
//    /workout-templates/{id}, que sigue siendo TRAINER-only + ownership)
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { WorkoutTemplate } from '../../trainer/models/trainer.models';
import {
  StudentDayResponse,
  StudentWorkoutDetail,
  StudentWorkoutResponse,
} from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentWorkoutService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  /** Resumen del workout activo (sin días) */
  getMyWorkout(): Observable<StudentWorkoutResponse> {
    return this.http.get<StudentWorkoutResponse>(`${this.api}/student-workouts/my-workout`);
  }

  /** Árbol completo de días/ejercicios de la plantilla activa del alumno */
  private getMyWorkoutDays(): Observable<WorkoutTemplate> {
    return this.http.get<WorkoutTemplate>(`${this.api}/student-workouts/my-workout/days`);
  }

  /** Un día puntual de la rutina activa (404 si no pertenece al plan) */
  getMyWorkoutDay(workoutDayId: number): Observable<StudentDayResponse> {
    return this.http.get<StudentDayResponse>(
      `${this.api}/student-workouts/my-workout/days/${workoutDayId}`
    );
  }

  /** Resumen + días/ejercicios, listo para el Dashboard */
  getMyWorkoutDetail(): Observable<StudentWorkoutDetail> {
    return this.getMyWorkout().pipe(
      switchMap(summary => {
        if (!summary.activeWorkout) {
          return of<StudentWorkoutDetail>({ summary, template: null });
        }
        return this.getMyWorkoutDays().pipe(
          map(template => ({ summary, template }))
        );
      })
    );
  }
}

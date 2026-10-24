// ─────────────────────────────────────────────
//  GymPlan — StudentProgressService
//  Junta el plan activo (días) + el historial de registros,
//  que es lo que necesitan Semana, Mes y "Hoy".
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { StudentWorkoutService } from './student-workout.service';
import { WorkoutLogService } from './workout-log.service';
import { StudentWorkoutDetail, WorkoutLogResponse } from '../models/student.models';
import { WorkoutTemplateDay } from '../../trainer/models/trainer.models';

export interface StudentProgress {
  detail: StudentWorkoutDetail;
  days: WorkoutTemplateDay[];        // ordenados como los armó el entrenador
  logs: WorkoutLogResponse[];        // historial completo (completados y no)
}

@Injectable({ providedIn: 'root' })
export class StudentProgressService {

  private readonly workoutService = inject(StudentWorkoutService);
  private readonly logService     = inject(WorkoutLogService);

  getProgress(): Observable<StudentProgress> {
    return forkJoin({
      detail: this.workoutService.getMyWorkoutDetail(),
      // Si el historial falla, la pantalla igual muestra el plan
      logs: this.logService.getMyHistory().pipe(catchError(() => of<WorkoutLogResponse[]>([]))),
    }).pipe(
      map(({ detail, logs }) => ({
        detail,
        logs,
        days: [...(detail.template?.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
      })),
    );
  }
}

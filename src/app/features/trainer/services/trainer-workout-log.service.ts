// ─────────────────────────────────────────────
//  PlanGym — TrainerWorkoutLogService
//  Entrenamientos de un alumno vistos/registrados por su entrenador.
//  GET  /api/workout-logs/student/{studentId}  (valida que el alumno sea suyo)
//  POST /api/workout-logs { studentId, workoutDayId, completedAt, completed }
//  (no hay "desmarcar" del lado del entrenador; lo puede desmarcar el alumno)
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { StudentDetail } from '../models/student.models';

export interface TrainerWorkoutLog {
  id: number;
  studentId: number;
  workoutDayId: number;
  workoutDayName: string;
  completedAt: string;      // YYYY-MM-DD
  completed: boolean;
  registeredById?: number;
  registeredByName?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainerWorkoutLogService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;

  history(studentId: number): Observable<TrainerWorkoutLog[]> {
    return this.http.get<TrainerWorkoutLog[]>(`${this.api}/workout-logs/student/${studentId}`);
  }

  markDone(studentId: number, workoutDayId: number, date: string): Observable<TrainerWorkoutLog> {
    return this.http.post<TrainerWorkoutLog>(`${this.api}/workout-logs`, {
      studentId, workoutDayId, completedAt: date, completed: true,
    });
  }

  /** Detalle del alumno con el plan activo completo (días + ejercicios) */
  studentDetail(studentId: number): Observable<StudentDetail> {
    return this.http.get<StudentDetail>(`${this.api}/v1/users/students/${studentId}`);
  }
}

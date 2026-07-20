// ─────────────────────────────────────────────
//  GymPlan — AssignmentService
//  HTTP calls para asignar templates a alumnos.
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import {
  StudentWorkout,
  AssignWorkoutRequest,
  UpdateAssignmentRequest,
} from '../models/trainer.models';

@Injectable({ providedIn: 'root' })
export class AssignmentService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  /** Asignar template a un alumno */
  assign(dto: AssignWorkoutRequest): Observable<StudentWorkout> {
    return this.http.post<StudentWorkout>(
      `${this.api}/api/v1/workout-templates/${dto.workoutTemplateId}/assign/${dto.studentId}`,
      {}
    );
  }

  /** Actualizar asignación (fechas, estado activo) */
  update(id: number, dto: UpdateAssignmentRequest): Observable<StudentWorkout> {
    return this.http.put<StudentWorkout>(`${this.api}/api/v1/student-workouts/${id}`, dto);
  }

  /** Desasignar / eliminar asignación */
  unassign(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/v1/student-workouts/${id}`);
  }
}
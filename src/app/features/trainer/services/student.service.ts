// ─────────────────────────────────────────────
//  GymPlan — StudentService
//  HTTP calls para alumnos del trainer.
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { StudentSummary, StudentWorkout } from '../models/trainer.models';
import { CreateStudentRequest, userResponse } from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  /** Lista de alumnos asignados al trainer autenticado */
  getMyStudents(): Observable<StudentSummary[]> {
    return this.http.get<StudentSummary[]>(`${this.api}/v1/users/students`);
  }

  /** Detalle de un alumno */
  getStudentById(id: number): Observable<StudentSummary> {
    return this.http.get<StudentSummary>(`${this.api}/v1/users/students/${id}`);
  }

  /** Workout activo del alumno */
  getStudentWorkout(studentId: number): Observable<StudentWorkout> {
    return this.http.get<StudentWorkout>(`${this.api}/v1/users/students/${studentId}/workout`);
  }

    /** Lista de alumnos asignados al trainer autenticado */
createStudent(request: CreateStudentRequest): Observable<userResponse> {
  console.log(request)
  return this.http.post<userResponse>(
    `${this.api}/auth/student`,
    request
  );
}
}
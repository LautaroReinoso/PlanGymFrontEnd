// ─────────────────────────────────────────────
//  GymPlan — WorkoutLogService
//  Registro de entrenamiento a nivel día completo
//  (el backend no soporta granularidad por serie).
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { WorkoutLogRequest, WorkoutLogResponse } from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class WorkoutLogService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  /** Registra un día como completado (o no) */
  register(dto: WorkoutLogRequest): Observable<WorkoutLogResponse> {
    return this.http.post<WorkoutLogResponse>(`${this.api}/workout-logs`, dto);
  }

  /** Historial completo del alumno autenticado */
  getMyHistory(): Observable<WorkoutLogResponse[]> {
    return this.http.get<WorkoutLogResponse[]>(`${this.api}/workout-logs/my-history`);
  }
}

// ─────────────────────────────────────────────
//  GymPlan — ExerciseService
//  HTTP calls para el catálogo de ejercicios.
//  Globales (GLOBAL_ADMIN) + propios del trainer.
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import {
  Exercise,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  MuscleGroup,
} from '../models/trainer.models';

@Injectable({ providedIn: 'root' })
export class ExerciseService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  /**
   * Lista todos los ejercicios disponibles para el trainer:
   * globales + los propios creados por él.
   * Opcionalmente filtra por nombre o muscleGroup.
   */
  getAll(filters?: { search?: string; muscleGroup?: MuscleGroup }): Observable<Exercise[]> {
    let params = new HttpParams();
    if (filters?.search)      params = params.set('search', filters.search);
    if (filters?.muscleGroup) params = params.set('muscleGroup', filters.muscleGroup);
    return this.http.get<Exercise[]>(`${this.api}/exercises`, { params });
  }

  /** Detalle de un ejercicio */
  getById(id: number): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.api}/api/v1/exercises/${id}`);
  }

  /** Crear ejercicio propio (no global) */
  create(dto: CreateExerciseRequest): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.api}/exercises`, dto);
  }

  /** Editar ejercicio propio */
  update(id: number, dto: UpdateExerciseRequest): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.api}/api/v1/exercises/${id}`, dto);
  }

  /** Eliminar ejercicio propio (no se pueden eliminar los globales) */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/v1/exercises/${id}`);
  }
}
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
  ExerciseDetail,
  ExerciseFilters,
  ExerciseRequest,
} from '../models/trainer.models';

@Injectable({ providedIn: 'root' })
export class ExerciseService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  /**
   * Listado (globales + propios, sin archivados).
   * Filtros opcionales: search, primaryMuscle, equipment, exerciseType, scope (default ALL).
   */
  getAll(filters: ExerciseFilters = {}): Observable<Exercise[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Exercise[]>(`${this.api}/exercises`, { params });
  }

  /** Detalle con canEdit / canCreateVariant calculados por el backend */
  getById(id: number): Observable<ExerciseDetail> {
    return this.http.get<ExerciseDetail>(`${this.api}/exercises/${id}`);
  }

  /** Crear ejercicio propio */
  create(dto: ExerciseRequest): Observable<ExerciseDetail> {
    return this.http.post<ExerciseDetail>(`${this.api}/exercises`, dto);
  }

  /** Editar ejercicio propio (PUT: reemplaza todos los campos) */
  update(id: number, dto: ExerciseRequest): Observable<ExerciseDetail> {
    return this.http.put<ExerciseDetail>(`${this.api}/exercises/${id}`, dto);
  }

  /** "Crear variante": el backend clona el ejercicio como propio y devuelve el nuevo */
  createVariant(id: number): Observable<ExerciseDetail> {
    return this.http.post<ExerciseDetail>(`${this.api}/exercises/${id}/variants`, {});
  }

  /** Archiva (soft delete) un ejercicio propio */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/exercises/${id}`);
  }
}

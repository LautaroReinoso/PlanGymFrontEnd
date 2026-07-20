// ─────────────────────────────────────────────
//  GymPlan — TemplateService
//  HTTP calls para workout templates del trainer.
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import {
  WorkoutTemplate,
  WorkoutTemplateSummary,
  WorkoutTemplateDay,
  DayExercise,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  CreateTemplateDayRequest,
  AddExerciseToDayRequest,
  UpdateDayRequest,
  WorkoutDayResponse,
} from '../models/trainer.models';

@Injectable({ providedIn: 'root' })
export class TemplateService {

  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;

  /** Lista de templates del trainer (sin días) */
  getAll(): Observable<WorkoutTemplateSummary[]> {
    return this.http.get<WorkoutTemplateSummary[]>(`${this.api}/workout-templates`);
  }

  /** Detalle completo con días y ejercicios */
  getById(id: number): Observable<WorkoutTemplate> {
    return this.http.get<WorkoutTemplate>(`${this.api}/workout-templates/${id}`);
  }

  /** Crear nueva plantilla */
  create(dto: CreateTemplateRequest): Observable<WorkoutTemplate> {
    return this.http.post<WorkoutTemplate>(`${this.api}/workout-templates`, dto);
  }

  /** Editar nombre/descripción */
  update(id: number, dto: UpdateTemplateRequest): Observable<WorkoutTemplate> {
    return this.http.put<WorkoutTemplate>(`${this.api}/workout-templates/${id}`, dto);
  }

  /** Eliminar plantilla */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/workout-templates/${id}`);
  }

  /** Agregar un día a la plantilla (auto-naming A/B/C) */
  addDay(templateId: number): Observable<WorkoutTemplateDay> {
    return this.http.post<WorkoutTemplateDay>(
      `${this.api}/workout-template-days/${templateId}/day`,
      {}
    );
  }

  /** Agregar ejercicio a un día */
  addExerciseToDay(
    dayId: number,
    dto: AddExerciseToDayRequest
  ): Observable<DayExercise> {
    return this.http.post<DayExercise>(
      `${this.api}/day-exercises/${dayId}/exercises`,
      dto
    );
  }
updateDay(workoutDayId: number, dto: UpdateDayRequest): Observable<WorkoutDayResponse> {
  return this.http.put<WorkoutDayResponse>(
    `${this.api}/api/v1/workout-days/${workoutDayId}`,
    dto
  );
}

    /** Eliminar un día */
    deleteDay(templateId: number, dayId: number): Observable < void> {
      return this.http.delete<void>(
        `${this.api}//${templateId}/days/${dayId}`
      );
    }

    /** Eliminar ejercicio de un día */
    removeExerciseFromDay(
      dayId: number,
      exerciseId: number
    ): Observable < void> {
      return this.http.delete<void>(
        `${this.api}/day-exercises/days/${dayId}/exercises/${exerciseId}`
      );
    }
  }
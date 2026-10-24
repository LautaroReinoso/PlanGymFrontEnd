// ─────────────────────────────────────────────
//  GymPlan — Student Models
//  Alineado al backend real:
//  - StudentWorkoutResponse (GET /student-workouts/my-workout)
//  - WorkoutTemplateDetailResponse, vía el nuevo
//    GET /student-workouts/my-workout/days (STUDENT-safe,
//    no pasa por el ownership check de /workout-templates/{id})
//  - WorkoutLogRequest/Response (día completo, no por serie)
// ─────────────────────────────────────────────

import { WorkoutTemplate, WorkoutTemplateDay } from '../../trainer/models/trainer.models';

// ══════════════════════════════════════════════
//  GET /api/student-workouts/my-workout
// ══════════════════════════════════════════════

export interface ActiveWorkoutSummary {
  startDate: string;             // ISO date
  workoutTemplateId: number;
  templateName: string;
  dayCount: number;
}

export interface StudentWorkoutResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentLastName: string;
  trainerId: number;
  trainerName: string;
  durationWeeks: number | null;  // dead field en el backend, siempre null
  activeWorkout: ActiveWorkoutSummary | null;
  adherencePercent: number | null;
}

// ══════════════════════════════════════════════
//  WORKOUT LOG (día completo, no por serie/ejercicio)
// ══════════════════════════════════════════════

export interface WorkoutLogRequest {
  studentId: number;
  workoutDayId: number;    // ⚠️ WorkoutTemplateDay.workoutDayId, NO WorkoutTemplateDay.id
  completedAt: string;     // ISO date "2026-09-27"
  completed: boolean;
}

export interface WorkoutLogResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentWorkoutId: number;
  workoutTemplateName: string;
  workoutDayId: number;
  workoutDayName: string;
  completedAt: string;     // ISO date
  completed: boolean;
  registeredById: number;
  registeredByName: string;
  createdAt: string;       // ISO datetime
}

// ══════════════════════════════════════════════
//  VISTA COMBINADA: workout activo + días completos
// ══════════════════════════════════════════════

export interface StudentWorkoutDetail {
  summary: StudentWorkoutResponse;
  template: WorkoutTemplate | null;   // null si no hay plan activo
}

// ══════════════════════════════════════════════
//  GET /api/student-workouts/my-workout/days/{workoutDayId}
//  Un día de la rutina activa (el alumno lo elige de su plan)
// ══════════════════════════════════════════════

// Día tal como lo devuelve el backend (no incluye dayNumber)
export type StudentDay = Omit<WorkoutTemplateDay, 'dayNumber' | 'workoutTemplateName'>;

export interface StudentDayResponse {
  templateId: number;
  templateName: string;
  position: number;    // 1-based: "Día 2"
  dayCount: number;    // total de días del plan: "de 4"
  day: StudentDay;
}

export interface TodayWorkoutView {
  day: WorkoutTemplateDay;
  exerciseCount: number;
}
export interface StudentProfile {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  direccion: string | null;
  ciudadProvincia: string | null;
  cel: string | null;
  dni: string;
  mail: string | null;
}

export type UpdateStudentProfileRequest = Omit<StudentProfile, 'id' | 'dni'>;
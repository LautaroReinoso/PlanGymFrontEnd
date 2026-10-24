// ─────────────────────────────────────────────
//  GymPlan — Trainer Models
//  Interfaces TypeScript alineadas al backend.
//  Módulos: Student, Exercise, WorkoutTemplate,
//           WorkoutTemplateDay, DayExercise,
//           StudentWorkout (asignación)
// ─────────────────────────────────────────────

import { ExerciseType, Laterality } from "./exercise-meta.util";
// ══════════════════════════════════════════════
//  TRAINER   
// ═══════  ════════════════════════════════════════════

export interface TrainerProfile {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
  direccion: string | null;
  ciudadProvincia: string | null;
  cel: string | null;
  mail: string;
}

export type UpdateTrainerProfileRequest = Omit<TrainerProfile, 'id' | 'mail'>;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ══════════════════════════════════════════════
//  STUDENTS
// ══════════════════════════════════════════════

export interface StudentSummary {
 id: number;
  fullName: string | null;        // sin ?, el campo siempre viene (puede ser null)
  dni: string;                    // string no number, el DNI puede tener ceros a la izquierda
  active: boolean;                // faltaba este campo
  activeWorkout: {
    startDate: string;
    templateName: string;
    dayCount: number;
  } | null;
  adherencePercent: number | null;         // 0-100
}

export interface WorkoutSummary {
  id: number;
  templateName: string;
  startDate: string;                // ISO date "2025-01-15"
  active: boolean;
}

// ══════════════════════════════════════════════
//  EXERCISES
// ══════════════════════════════════════════════

export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'FOREARMS'
  | 'QUADRICEPS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'CORE'
  | 'FULL_BODY';

export type Equipment =
  | 'BARBELL'
  | 'DUMBBELL'
  | 'MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'KETTLEBELL'
  | 'BAND'
  | 'OTHER';

/** Filtro de alcance del listado: globales, propios o todos */
export type ExerciseScope = 'GLOBAL' | 'MINE' | 'ALL';

/** Item de listado — espejo de ExerciseResponse (backend). Sin colecciones. */
export interface Exercise {
  id: number;
  name: string;
  description?: string | null;
  primaryMuscle: MuscleGroup;
  exerciseType?: ExerciseType | null;
  equipment?: Equipment | null;
  laterality?: Laterality | null;
  difficulty: number;
  imageUrl?: string | null;
  global: boolean;
  trainerId?: number | null;      // null si es global
  trainerName?: string | null;    // null si es global
  parentExerciseId?: number | null;
  createdAt?: string | null;
}

/** Detalle — espejo de ExerciseDetailDto (backend).
 *  canEdit / canCreateVariant los calcula el backend; el front solo los lee. */
export interface ExerciseDetail {
  id: number;
  name: string;
  description?: string | null;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  exerciseType?: ExerciseType | null;
  equipment?: Equipment | null;
  laterality?: Laterality | null;
  difficulty: number;
  defaultSets?: number | null;
  defaultRepsMin?: number | null;
  defaultRepsMax?: number | null;
  defaultRestSeconds?: number | null;
  techniqueSteps: string[];
  imageUrl?: string | null;
  videoUrl?: string | null;
  global: boolean;
  parentExerciseId?: number | null;
  parentExerciseName?: string | null;
  canEdit: boolean;
  canCreateVariant: boolean;
}

/** Create y update usan el mismo DTO (ExerciseRequest). PUT reemplaza todo. */
export interface ExerciseRequest {
  name: string;
  description?: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  exerciseType?: ExerciseType;
  equipment?: Equipment;
  laterality?: Laterality;
  difficulty: number;
  defaultSets?: number;
  defaultRepsMin?: number;
  defaultRepsMax?: number;
  defaultRestSeconds?: number;
  techniqueSteps?: string[];
  imageUrl?: string;
  videoUrl?: string;
}

export type CreateExerciseRequest = ExerciseRequest;
export type UpdateExerciseRequest = ExerciseRequest;

/** Filtros del GET /exercises (todos opcionales) */
export interface ExerciseFilters {
  search?: string;
  primaryMuscle?: MuscleGroup;
  equipment?: Equipment;
  exerciseType?: ExerciseType;
  scope?: ExerciseScope;
}

// ══════════════════════════════════════════════
//  WORKOUT TEMPLATES
// ══════════════════════════════════════════════

export interface WorkoutTemplate {
  id: number;
  name: string;
  description?: string;
  trainerId: number;
  days: WorkoutTemplateDay[];
}

// Template sin días — para listas/cards
export interface WorkoutTemplateSummary {
  id: number;
  name: string;
  description?: string;
  dayCount: number;
  exerciseCount?: number;      // pendiente de backend
  assignedStudents?: number;   // pendiente de backend
}


export interface CreateTemplateRequest {
  name: string;
  description?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
}

// ══════════════════════════════════════════════
//  WORKOUT TEMPLATE DAYS
// ══════════════════════════════════════════════

export interface WorkoutTemplateDay {
  id: number;
  name: string;
  description: string;
  orderIndex: number;
  workoutDayId: number;
    exercises: DayExercise[];
  workoutTemplateName: string;     // 0 = primer día, 1 = segundo día, …
  dayNumber: number;               // 1 = Lunes … 7 = Domingo
}

export interface CreateTemplateDayRequest {
  dayNumber: number;
  name: string;
}
export interface UpdateDayRequest {
  name: string;
  description: string;
  orderIndex: number;
}
 
// ── DTO de response (alineado con WorkoutDayResponse del backend) ──
export interface WorkoutDayResponse {
  id: number;
  name: string;
  description: string;
  orderIndex: number;
}
 

// ══════════════════════════════════════════════
//  DAY EXERCISES
// ══════════════════════════════════════════════

/** Espejo de DayExerciseResponse (backend) */
export interface DayExercise {
  id: number;
  workoutDayId?: number;
  workoutDayName?: string;
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  difficulty: number;                 // 1-5
  imageUrl: string;
  sets: number;
  reps: number;                       // mínimo del rango
  repsMax?: number | null;            // tope del rango (opcional)
  weightSuggestion?: number | null;   // kg
  restSeconds: number | null;
  notes?: string;
  orderIndex: number;
}

/** Espejo de DayExerciseRequest. Lo que venga vacío (sets, reps/repsMax,
 *  restSeconds) el backend lo prellena con los default* del ejercicio. */
export interface AddExerciseToDayRequest {
  exerciseId: number;
  sets?: number;
  reps?: number;
  repsMax?: number;
  restSeconds?: number;
  weightSuggestion?: number;
  orderIndex?: number;
  notes?: string;
}

// ══════════════════════════════════════════════
//  STUDENT WORKOUT (asignación)
// ══════════════════════════════════════════════

export interface StudentWorkout {
  id: number;
  studentId: number;
  studentMail?: string;
  template: WorkoutTemplateSummary;
  startDate: string;               // ISO date
  active: boolean;
}

export interface AssignWorkoutRequest {
  studentId: number;
  workoutTemplateId: number;
  startDate: string;               // ISO date "2025-06-01"
}

export interface UpdateAssignmentRequest {
  startDate?: string;
  active?: boolean;
}

// ══════════════════════════════════════════════
//  UI HELPERS
// ══════════════════════════════════════════════

// Nombre del día de la semana por número
export const DAY_NAMES: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};
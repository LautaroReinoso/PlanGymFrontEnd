// ─────────────────────────────────────────────
//  GymPlan — Trainer Models
//  Interfaces TypeScript alineadas al backend.
//  Módulos: Student, Exercise, WorkoutTemplate,
//           WorkoutTemplateDay, DayExercise,
//           StudentWorkout (asignación)
// ─────────────────────────────────────────────

// ══════════════════════════════════════════════
//  STUDENTS
// ══════════════════════════════════════════════

export interface StudentSummary {
  id: number;
  mail: string;
  fullName?: string;
  activeWorkout: WorkoutSummary | null;
  adherencePercent?: number;        // 0-100
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
  | 'LEGS'
  | 'GLUTES'
  | 'CORE'
  | 'CARDIO'
  | 'FULL_BODY';

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscleGroup: MuscleGroup;
  isGlobal: boolean;                // true = creado por GLOBAL_ADMIN
  createdByTrainerId?: number;
}

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  muscleGroup: MuscleGroup;
}

export interface UpdateExerciseRequest {
  name?: string;
  description?: string;
  muscleGroup?: MuscleGroup;
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
}
 
// ── DTO de response (alineado con WorkoutDayResponse del backend) ──
export interface WorkoutDayResponse {
  id: number;
  name: string;
  description: string;
}
 

// ══════════════════════════════════════════════
//  DAY EXERCISES
// ══════════════════════════════════════════════

export interface DayExercise {
  id: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  difficulty: number;                 // 1-5
  imageUrl: string;
  sets: number;
  reps: number;
   weight?: number;
     restSeconds: number;
  notes?: string;
  orderIndex: number;
}

export interface AddExerciseToDayRequest {
  exerciseId: number;
  sets: number;
  reps: number;
  restSeconds: number;
  weight?: number;
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

// Mapeo de MuscleGroup a label en español
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  LEGS: 'Piernas',
  GLUTES: 'Glúteos',
  CORE: 'Core',
  CARDIO: 'Cardio',
  FULL_BODY: 'Cuerpo completo',
};

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
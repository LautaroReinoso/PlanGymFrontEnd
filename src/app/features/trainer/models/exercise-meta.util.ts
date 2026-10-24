// ─────────────────────────────────────────────
//  GymPlan — Exercise metadata labels (ES)
//  exerciseType, laterality, equipment, difficulty
// ─────────────────────────────────────────────

import type { Equipment, ExerciseRequest, ExerciseScope, MuscleGroup } from './trainer.models';

export type ExerciseType = 'COMPOUND' | 'ISOLATION';
export type Laterality = 'BILATERAL' | 'UNILATERAL';

// ── Tipo de ejercicio ─────────────────────────
export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  COMPOUND: 'Multiarticular',
  ISOLATION: 'Aislamiento',
};

export function exerciseTypeLabel(type?: string | null): string | null {
  if (!type) return null;
  return EXERCISE_TYPE_LABELS[type as ExerciseType] ?? type;
}

export const EXERCISE_TYPE_OPTIONS: { value: ExerciseType; label: string }[] =
  (Object.keys(EXERCISE_TYPE_LABELS) as ExerciseType[]).map(value => ({
    value,
    label: EXERCISE_TYPE_LABELS[value],
  }));

// ── Lateralidad ───────────────────────────────
export const LATERALITY_LABELS: Record<Laterality, string> = {
  BILATERAL: 'Bilateral',
  UNILATERAL: 'Unilateral',
};

export function lateralityLabel(lat?: string | null): string | null {
  if (!lat) return null;
  return LATERALITY_LABELS[lat as Laterality] ?? lat;
}

export const LATERALITY_OPTIONS: { value: Laterality; label: string }[] =
  (Object.keys(LATERALITY_LABELS) as Laterality[]).map(value => ({
    value,
    label: LATERALITY_LABELS[value],
  }));

// ── Equipamiento ──────────────────────────────
export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL:    'Barra',
  DUMBBELL:   'Mancuernas',
  MACHINE:    'Máquina',
  CABLE:      'Polea',
  BODYWEIGHT: 'Peso corporal',
  KETTLEBELL: 'Pesa rusa',
  BAND:       'Banda elástica',
  OTHER:      'Otro',
};

export function equipmentLabel(equipment?: string | null): string | null {
  if (!equipment) return null;
  return EQUIPMENT_LABELS[equipment as Equipment] ?? equipment;
}

export const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] =
  (Object.keys(EQUIPMENT_LABELS) as Equipment[]).map(value => ({
    value,
    label: EQUIPMENT_LABELS[value],
  }));

// ── Alcance (filtro del listado) ──────────────
export const SCOPE_OPTIONS: { value: ExerciseScope; label: string }[] = [
  { value: 'ALL',    label: 'Todos' },
  { value: 'GLOBAL', label: 'Globales' },
  { value: 'MINE',   label: 'Míos' },
];

// ── Descanso ──────────────────────────────────
/** 90 → "90 s", 120 → "2 min", 150 → "2 min 30 s" */
export function restLabel(seconds?: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** 8–10 / 8 / null */
export function repsRangeLabel(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max}`;
  return String(min ?? max);
}

// ── Dificultad (1-5) ──────────────────────────
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Principiante',
  2: 'Fácil',
  3: 'Intermedio',
  4: 'Avanzado',
  5: 'Experto',
};

export function difficultyLabel(level?: number | null): string | null {
  if (!level) return null;
  return DIFFICULTY_LABELS[level] ?? `Nivel ${level}`;
}

export const DIFFICULTY_OPTIONS: { value: number; label: string }[] =
  Object.keys(DIFFICULTY_LABELS).map(k => ({
    value: Number(k),
    label: DIFFICULTY_LABELS[Number(k)],
  }));

// ── Payload helper ────────────────────────────
// Convierte lo que emite ExerciseFormComponent ('' en selects opcionales,
// null en números vacíos, técnica como texto "un paso por línea") al
// ExerciseRequest que espera el backend. Un solo lugar para esta conversión,
// usado por ExercisesPage, ExerciseDetailPage y AddExercisesModal.
export interface ExerciseFormValueLike {
  name: string;
  description: string;
  primaryMuscle: MuscleGroup | '';
  secondaryMuscles: MuscleGroup[];
  difficulty: number;
  imageUrl: string;
  videoUrl: string;
  techniqueText: string;
  exerciseType: ExerciseType | '';
  equipment: Equipment | '';
  laterality: Laterality | '';
  defaultSets: number | null;
  defaultRepsMin: number | null;
  defaultRepsMax: number | null;
  defaultRestSeconds: number | null;
}

/** Separa el texto en pasos: ignora líneas vacías y numeración "1." / "1)" / "- " al inicio */
export function parseTechniqueSteps(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map(line => line.trim().replace(/^(\d+\s*[.)-]|[-•*])\s*/, '').trim())
    .filter(line => line.length > 0);
}

const numOrUndef = (n: number | null | undefined): number | undefined =>
  n === null || n === undefined || Number.isNaN(n) ? undefined : Number(n);

export function toExercisePayload(value: ExerciseFormValueLike): ExerciseRequest {
  const primary = value.primaryMuscle as MuscleGroup;
  return {
    name:               value.name.trim(),
    description:        value.description?.trim() || undefined,
    primaryMuscle:      primary,
    secondaryMuscles:   (value.secondaryMuscles ?? []).filter(m => m !== primary),
    difficulty:         value.difficulty,
    imageUrl:           value.imageUrl?.trim() || undefined,
    videoUrl:           value.videoUrl?.trim() || undefined,
    techniqueSteps:     parseTechniqueSteps(value.techniqueText),
    exerciseType:       value.exerciseType || undefined,
    equipment:          value.equipment || undefined,
    laterality:         value.laterality || undefined,
    defaultSets:        numOrUndef(value.defaultSets),
    defaultRepsMin:     numOrUndef(value.defaultRepsMin),
    defaultRepsMax:     numOrUndef(value.defaultRepsMax),
    defaultRestSeconds: numOrUndef(value.defaultRestSeconds),
  };
}

/** "3 series · 8–10 reps · 20kg · 90 s" — formato común Trainer/Student */
export function dayExerciseSummary(de: {
  sets: number; reps: number; repsMax?: number | null;
  weightSuggestion?: number | null; restSeconds?: number | null;
}): string {
  const parts = [`${de.sets} series`, `${repsRangeLabel(de.reps, de.repsMax)} reps`];
  if (de.weightSuggestion) parts.push(`${de.weightSuggestion}kg`);
  const rest = restLabel(de.restSeconds);
  if (rest) parts.push(rest);
  return parts.join(' · ');
}

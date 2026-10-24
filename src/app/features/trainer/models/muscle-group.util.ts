import { MuscleGroup } from './trainer.models';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST:      'Pecho',
  BACK:       'Espalda',
  SHOULDERS:  'Hombros',
  BICEPS:     'Bíceps',
  TRICEPS:    'Tríceps',
  FOREARMS:   'Antebrazos',
  QUADRICEPS: 'Cuádriceps',
  HAMSTRINGS: 'Isquiotibiales',
  GLUTES:     'Glúteos',
  CALVES:     'Gemelos',
  CORE:       'Core',
  FULL_BODY:  'Cuerpo completo',
};

/** Tolerante: si llega un valor desconocido (p. ej. datos viejos), muestra el crudo. */
export function muscleGroupLabel(mg?: MuscleGroup | string | null): string {
  if (!mg) return '';
  return MUSCLE_GROUP_LABELS[mg as MuscleGroup] ?? mg;
}

export const MUSCLE_GROUP_OPTIONS: { value: MuscleGroup; label: string }[] =
  (Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map(value => ({
    value,
    label: MUSCLE_GROUP_LABELS[value],
  }));

// ─────────────────────────────────────────────
//  GymPlan — Progreso del alumno (helpers puros)
//  Fechas en hora LOCAL como "YYYY-MM-DD" (igual que
//  WorkoutLogResponse.completedAt). Semana de lunes a domingo.
// ─────────────────────────────────────────────

import { WorkoutTemplateDay } from '../../trainer/models/trainer.models';
import { WorkoutLogResponse } from '../models/student.models';

export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Date → "YYYY-MM-DD" en hora local (no UTC: evita correr el día de noche) */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" → Date local a medianoche */
export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Lunes de la semana de `d` */
export function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7; // 0 = lunes … 6 = domingo
  return addDays(r, -dow);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Solo los registros marcados como completados */
export function completedLogs(logs: WorkoutLogResponse[]): WorkoutLogResponse[] {
  return logs.filter(l => l.completed);
}

/** Mapa fecha → registros completados ese día */
export function logsByDate(logs: WorkoutLogResponse[]): Map<string, WorkoutLogResponse[]> {
  const map = new Map<string, WorkoutLogResponse[]>();
  for (const log of completedLogs(logs)) {
    const key = log.completedAt.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), log]);
  }
  return map;
}

/** Registros completados entre dos fechas ISO (inclusive) */
export function logsBetween(logs: WorkoutLogResponse[], fromIso: string, toIso: string): WorkoutLogResponse[] {
  return completedLogs(logs).filter(l => {
    const d = l.completedAt.slice(0, 10);
    return d >= fromIso && d <= toIso;
  });
}

/**
 * Próximo día sugerido de la semana: el primer día del plan (en el orden del
 * entrenador) que todavía no se hizo esta semana. Si ya hizo todos, null.
 */
export function nextSuggestedDay(
  days: WorkoutTemplateDay[],
  logs: WorkoutLogResponse[],
  ref: Date = new Date(),
): WorkoutTemplateDay | null {
  const from = toIsoDate(startOfWeek(ref));
  const to = toIsoDate(addDays(startOfWeek(ref), 6));
  const doneIds = new Set(logsBetween(logs, from, to).map(l => l.workoutDayId));
  const ordered = [...days].sort((a, b) => a.orderIndex - b.orderIndex);
  return ordered.find(d => !doneIds.has(d.workoutDayId)) ?? null;
}

/** Semanas consecutivas (hasta la actual) con al menos un entrenamiento */
export function weekStreak(logs: WorkoutLogResponse[], ref: Date = new Date()): number {
  const weeks = new Set(
    completedLogs(logs).map(l => toIsoDate(startOfWeek(fromIsoDate(l.completedAt)))),
  );
  let monday = startOfWeek(ref);
  // La semana actual todavía no terminó: si no entrenó, no corta la racha.
  if (!weeks.has(toIsoDate(monday))) monday = addDays(monday, -7);
  let streak = 0;
  while (weeks.has(toIsoDate(monday))) {
    streak++;
    monday = addDays(monday, -7);
  }
  return streak;
}

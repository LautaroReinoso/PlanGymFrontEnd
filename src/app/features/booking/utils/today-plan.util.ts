// ─────────────────────────────────────────────
//  PlanGym — "Le toca" (pantalla Hoy del entrenador)
//  Mismo criterio que el "Hoy" del alumno:
//   1) si ya registró un día HOY → ese ("Entrenó · X");
//   2) si no, el primer día del plan (por orden) sin registrar en la semana lun–dom → "Toca: X";
//   3) si hizo todos → "Semana completa" (se muestra el Día 1).
//  Lógica pura: sin Angular, testeable.
// ─────────────────────────────────────────────

import { addDays, startOfWeek } from './booking-date.util';

/** Lo mínimo que necesita del día del plan */
export interface PlanDayLike { workoutDayId: number; name: string; orderIndex: number; }
/** Lo mínimo que necesita del registro de entrenamiento */
export interface LogLike { workoutDayId: number; workoutDayName?: string; completedAt: string; completed: boolean; }

export type TodayKind = 'noPlan' | 'doneToday' | 'next' | 'weekDone';

export interface TodayPlan<D extends PlanDayLike> {
  kind: TodayKind;
  day: D | null;
  label: string;
}

/**
 * @param days  días del plan activo (en cualquier orden)
 * @param logs  registros del alumno
 * @param today "YYYY-MM-DD" (hora de Argentina)
 */
export function todayPlan<D extends PlanDayLike>(days: D[], logs: LogLike[], today: string): TodayPlan<D> {
  const ordered = [...days].sort((a, b) => a.orderIndex - b.orderIndex);
  if (!ordered.length) return { kind: 'noPlan', day: null, label: 'Sin plan' };

  const doneToday = logs.find(l => l.completed && l.completedAt === today);
  if (doneToday) {
    const d = ordered.find(x => x.workoutDayId === doneToday.workoutDayId) ?? null;
    return { kind: 'doneToday', day: d, label: `Entrenó · ${d?.name ?? doneToday.workoutDayName ?? ''}`.trim() };
  }

  const from = startOfWeek(today);
  const to = addDays(from, 6);
  const doneThisWeek = new Set(
    logs.filter(l => l.completed && l.completedAt >= from && l.completedAt <= to).map(l => l.workoutDayId));
  const next = ordered.find(d => !doneThisWeek.has(d.workoutDayId));
  return next
    ? { kind: 'next', day: next, label: `Toca: ${next.name}` }
    : { kind: 'weekDone', day: ordered[0], label: 'Semana completa' };
}

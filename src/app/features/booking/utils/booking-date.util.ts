// ─────────────────────────────────────────────
//  PlanGym — utilidades de fechas para turnos
//  Las fechas de calendario son strings "YYYY-MM-DD" (sin zona).
//  Los instantes ISO del backend se leen por texto: la fecha y la
//  hora que muestra son las de Argentina tal como vinieron.
// ─────────────────────────────────────────────

import { BookingStatus, DayOfWeek } from '../models/booking.models';

export const MAX_RANGE_DAYS = 92;

export const DAY_LABELS: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};
export const DAY_SHORT: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom',
};
export const DAY_OPTIONS = ([1, 2, 3, 4, 5, 6, 7] as DayOfWeek[]).map(d => ({ value: d, label: DAY_LABELS[d] }));

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmada', COMPLETED: 'Tomada', NO_SHOW: 'Ausente', CANCELLED: 'Cancelada',
};

// ── Fechas de calendario (YYYY-MM-DD) ─────────
function pad(n: number): string { return n < 10 ? '0' + n : '' + n; }

/** Fecha local de hoy como YYYY-MM-DD. */
export function todayKey(): string { return toKey(new Date()); }

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parsea YYYY-MM-DD a Date local al mediodía (evita saltos por horario de verano). */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

export function addMonths(key: string, months: number): string {
  const d = fromKey(key);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return toKey(d);
}

/** 1 = lunes … 7 = domingo */
export function isoDow(key: string): DayOfWeek {
  const js = fromKey(key).getDay();
  return (js === 0 ? 7 : js) as DayOfWeek;
}

export function startOfWeek(key: string): string { return addDays(key, 1 - isoDow(key)); }

export function startOfMonth(key: string): string { return key.slice(0, 8) + '01'; }

export function daysBetween(from: string, to: string): number {
  return Math.round((fromKey(to).getTime() - fromKey(from).getTime()) / 86_400_000);
}

export interface DateRange { from: string; to: string; }

/** Lunes a domingo de la semana que contiene `key`. */
export function weekRange(key: string): DateRange {
  const from = startOfWeek(key);
  return { from, to: addDays(from, 6) };
}

/** Grilla completa del mes (incluye los días del mes anterior/siguiente visibles). */
export function monthGridRange(key: string): DateRange {
  const first = startOfMonth(key);
  const from = startOfWeek(first);
  const last = addDays(addMonths(first, 1), -1);
  const to = addDays(startOfWeek(last), 6);
  return { from, to };
}

/** Parte un rango en tramos de como máximo 92 días (inclusive). */
export function splitRange(range: DateRange, max = MAX_RANGE_DAYS): DateRange[] {
  const out: DateRange[] = [];
  let from = range.from;
  while (daysBetween(from, range.to) >= 0) {
    const end = addDays(from, max - 1);
    const to = daysBetween(end, range.to) < 0 ? range.to : end;
    out.push({ from, to });
    from = addDays(to, 1);
  }
  return out;
}

export function listDays(range: DateRange): string[] {
  const out: string[] = [];
  for (let k = range.from; daysBetween(k, range.to) >= 0; k = addDays(k, 1)) out.push(k);
  return out;
}

// ── Instantes ISO del backend ──────────────────
/** "2026-11-10T18:00:00-03:00" → "2026-11-10" (sin convertir zona). */
export function isoDateKey(iso: string): string { return iso.slice(0, 10); }

/** "2026-11-10T18:00:00-03:00" → "18:00" (sin convertir zona). */
export function isoTime(iso: string): string { return iso.slice(11, 16); }

/** "HH:mm" o "HH:mm:ss" → "HH:mm" */
export function hhmm(time: string | null | undefined): string { return (time ?? '').slice(0, 5); }

/** ¿El instante ya pasó? Compara por texto en hora de Argentina vs. ahora en Argentina. */
export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

// ── Textos ────────────────────────────────────
export function monthTitle(key: string): string {
  const d = fromKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "lun 10 nov" */
export function shortDate(key: string): string {
  const d = fromKey(key);
  return `${DAY_SHORT[isoDow(key)].toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "Lunes 10 de noviembre" */
export function longDate(key: string): string {
  const d = fromKey(key);
  return `${DAY_LABELS[isoDow(key)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function weekTitle(range: DateRange): string {
  const a = fromKey(range.from), b = fromKey(range.to);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} al ${b.getDate()} de ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()].slice(0, 3)} al ${b.getDate()} ${MONTHS[b.getMonth()].slice(0, 3)}`;
}

/** [{dayOfWeek:1,…},{dayOfWeek:3,…}] a las 18:00 → "Lunes y miércoles 18:00" */
export function joinDays(days: DayOfWeek[]): string {
  const names = [...new Set(days)].sort().map((d, i) => i === 0 ? DAY_LABELS[d] : DAY_LABELS[d].toLowerCase());
  if (names.length <= 1) return names.join('');
  return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
}

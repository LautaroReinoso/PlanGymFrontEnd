// ─────────────────────────────────────────────
//  PlanGym — Recuperaciones: plazo de 30 días por clase (no "el mismo mes").
//  El backend es la fuente de verdad; esto solo arma textos y habilita horarios.
// ─────────────────────────────────────────────

import { RecoverySummary } from '../models/booking.models';

type Item = RecoverySummary['items'][number];

/** Clases todavía disponibles para recuperar (no usadas y no vencidas). */
export function pendingRecoveries(r: RecoverySummary | null | undefined, now = new Date()): Item[] {
  if (!r) return [];
  return r.items
    .filter(i => !i.recoveredByBookingId && (!i.expiresAt || new Date(i.expiresAt) > now))
    .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''));
}

/** Vencimiento más lejano entre las disponibles: hasta ahí se pueden elegir horarios. */
export function latestRecoveryDeadline(r: RecoverySummary | null | undefined): string | null {
  const items = pendingRecoveries(r);
  const dates = items.map(i => i.expiresAt).filter((d): d is string => !!d);
  if (dates.length) return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  return r?.expiresAt ?? null;
}

/** ¿El horario cae antes del vencimiento más lejano? (sin dato de vencimiento → sí) */
export function withinRecoveryWindow(r: RecoverySummary | null | undefined, startAt: string): boolean {
  const d = latestRecoveryDeadline(r);
  return !d || new Date(startAt) < new Date(d);
}

/** Vence en 7 días o menos → se marca en ámbar. */
export function expiresSoon(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - now.getTime() <= 7 * 24 * 3600 * 1000;
}

/** "14/12" (fecha de calendario del texto ISO, sin pasar por la zona del navegador). */
export function ddmm(iso: string | null | undefined): string {
  if (!iso) return '';
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}`;
}

/** Fecha de la clase + 30 días, "dd/MM" (para el aviso de cancelación del profe si no hay item). */
export function plus30(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 30));
  return `${String(dt.getUTCDate()).padStart(2, '0')}/${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

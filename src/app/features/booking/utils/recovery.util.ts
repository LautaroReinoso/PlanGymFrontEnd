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

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Tope de ausencias del mes de esa clase ya usado: el backend cuenta, por profesional y mes de la
 * clase faltada, las ausencias que ya se recuperaron. Si llegó al tope, una ausencia nueva de ese
 * mes no da recuperación. Devuelve el texto del aviso o null. (Las cancelaciones del profe no cuentan.)
 */
export function absenceCapNotice(r: RecoverySummary | null | undefined, classStartAt: string): string | null {
  if (!r) return null;
  const month = classStartAt.slice(0, 7);
  const name = MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? '';
  if (r.limit <= 0) return 'Tu entrenador no tiene habilitado recuperar las clases que avisás que no vas.';
  const usedThisMonth = r.items.filter(i =>
    (i.source ?? 'ABSENCE') === 'ABSENCE' && !!i.recoveredByBookingId && i.startAt.slice(0, 7) === month).length;
  if (usedThisMonth < r.limit) return null;
  return `Ya usaste tus ${r.limit} recuperaciones de ${name}. Si avisás que no vas a una clase de ${name}, esa no se recupera.`;
}

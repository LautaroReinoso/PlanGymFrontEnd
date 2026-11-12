import { RecoverySummary } from '../models/booking.models';
import {
  absenceCapNotice, ddmm, expiresSoon, latestRecoveryDeadline, pendingRecoveries, plus30, withinRecoveryWindow,
} from './recovery.util';

type Item = RecoverySummary['items'][number];

function item(p: Partial<Item>): Item {
  return {
    absenceBookingId: 1, source: 'ABSENCE', cancelReason: null, serviceId: 1, serviceName: 'Funcional',
    professionalId: 1, professionalName: 'Profe', startAt: '2026-11-10T18:00:00-03:00',
    recoveredByBookingId: null, recoveredAt: null, expiresAt: '2026-12-10T18:00:00-03:00', ...p,
  } as Item;
}
function summary(items: Item[], limit = 3): RecoverySummary {
  return { month: '2026-11', limit, absences: items.length, professionalCancels: 0, used: 0,
           available: items.filter(i => !i.recoveredByBookingId).length, expiresAt: items[0]?.expiresAt ?? null, items } as RecoverySummary;
}

describe('recovery.util', () => {
  const now = new Date('2026-11-12T12:00:00-03:00');

  it('ddmm lee la fecha del texto, sin zona del navegador', () => {
    expect(ddmm('2026-12-01T00:30:00-03:00')).toBe('01/12');
    expect(ddmm(null)).toBe('');
  });

  it('plus30 suma 30 días y cruza de mes', () => {
    expect(plus30('2026-11-20T18:00:00-03:00')).toBe('20/12');
    expect(plus30('2026-12-15T18:00:00-03:00')).toBe('14/01');
  });

  it('pendingRecoveries excluye usadas y vencidas, la que vence antes primero', () => {
    const r = summary([
      item({ absenceBookingId: 1, expiresAt: '2026-12-20T00:00:00-03:00' }),
      item({ absenceBookingId: 2, expiresAt: '2026-12-01T00:00:00-03:00' }),
      item({ absenceBookingId: 3, recoveredByBookingId: 99 }),
      item({ absenceBookingId: 4, expiresAt: '2026-11-01T00:00:00-03:00' }),
    ]);
    expect(pendingRecoveries(r, now).map(i => i.absenceBookingId)).toEqual([2, 1]);
  });

  it('withinRecoveryWindow usa el vencimiento más lejano (permite el mes siguiente)', () => {
    const r = summary([item({ expiresAt: '2026-12-10T18:00:00-03:00' })]);
    expect(latestRecoveryDeadline(r)).toBe('2026-12-10T18:00:00-03:00');
    expect(withinRecoveryWindow(r, '2026-12-05T18:00:00-03:00')).toBeTrue();
    expect(withinRecoveryWindow(r, '2026-12-11T18:00:00-03:00')).toBeFalse();
  });

  it('expiresSoon marca 7 días o menos', () => {
    expect(expiresSoon('2026-11-18T12:00:00-03:00', now)).toBeTrue();
    expect(expiresSoon('2026-11-25T12:00:00-03:00', now)).toBeFalse();
  });

  it('absenceCapNotice avisa cuando se usó el tope del mes de la clase', () => {
    const used = [1, 2, 3].map(n => item({ absenceBookingId: n, recoveredByBookingId: 100 + n }));
    expect(absenceCapNotice(summary(used, 3), '2026-11-20T18:00:00-03:00')).toContain('noviembre');
    expect(absenceCapNotice(summary(used, 3), '2026-12-02T18:00:00-03:00')).toBeNull();
    expect(absenceCapNotice(summary(used.slice(0, 2), 3), '2026-11-20T18:00:00-03:00')).toBeNull();
    expect(absenceCapNotice(summary([], 0), '2026-11-20T18:00:00-03:00')).toContain('no tiene habilitado');
  });
});

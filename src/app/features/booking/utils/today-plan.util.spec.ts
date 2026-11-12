import { todayPlan } from './today-plan.util';

describe('todayPlan ("le toca" del entrenador)', () => {
  // Jueves 12/11/2026 → semana lun 9 – dom 15
  const TODAY = '2026-11-12';
  const days = [
    { workoutDayId: 103, name: 'Piernas', orderIndex: 3 },
    { workoutDayId: 101, name: 'Empuje', orderIndex: 1 },
    { workoutDayId: 102, name: 'Tracción', orderIndex: 2 },
  ];
  const log = (workoutDayId: number, completedAt: string, completed = true) => ({ workoutDayId, completedAt, completed });

  it('sin días en el plan → Sin plan', () => {
    expect(todayPlan([], [], TODAY)).toEqual({ kind: 'noPlan', day: null, label: 'Sin plan' });
  });

  it('sin registros → el primer día por orden (no por posición en el array)', () => {
    const r = todayPlan(days, [], TODAY);
    expect(r.kind).toBe('next');
    expect(r.day?.name).toBe('Empuje');
    expect(r.label).toBe('Toca: Empuje');
  });

  it('si ya hizo días esta semana → el primero pendiente', () => {
    const r = todayPlan(days, [log(101, '2026-11-09')], TODAY);
    expect(r.day?.name).toBe('Tracción');
  });

  it('los registros de la semana anterior no cuentan', () => {
    const r = todayPlan(days, [log(101, '2026-11-08'), log(102, '2026-11-02')], TODAY);
    expect(r.day?.name).toBe('Empuje');
  });

  it('el domingo cuenta dentro de la semana (lun–dom)', () => {
    const r = todayPlan(days, [log(101, '2026-11-15')], TODAY);
    expect(r.day?.name).toBe('Tracción');
  });

  it('si ya entrenó hoy → ese día, aunque haya pendientes', () => {
    const r = todayPlan(days, [log(103, TODAY)], TODAY);
    expect(r.kind).toBe('doneToday');
    expect(r.day?.name).toBe('Piernas');
    expect(r.label).toBe('Entrenó · Piernas');
  });

  it('registro de hoy de un día que ya no está en el plan → usa el nombre del registro', () => {
    const r = todayPlan(days, [{ workoutDayId: 999, workoutDayName: 'Viejo', completedAt: TODAY, completed: true }], TODAY);
    expect(r.kind).toBe('doneToday');
    expect(r.day).toBeNull();
    expect(r.label).toBe('Entrenó · Viejo');
  });

  it('registros con completed=false se ignoran', () => {
    const r = todayPlan(days, [log(101, TODAY, false), log(102, '2026-11-10', false)], TODAY);
    expect(r.kind).toBe('next');
    expect(r.day?.name).toBe('Empuje');
  });

  it('hizo todos los días → Semana completa (muestra el Día 1)', () => {
    const r = todayPlan(days, [log(101, '2026-11-09'), log(102, '2026-11-10'), log(103, '2026-11-11')], TODAY);
    expect(r.kind).toBe('weekDone');
    expect(r.day?.name).toBe('Empuje');
    expect(r.label).toBe('Semana completa');
  });

  it('cambio de mes: semana que empieza en el mes anterior', () => {
    // Martes 1/12/2026 → semana lun 30/11 – dom 6/12
    const r = todayPlan(days, [log(101, '2026-11-30')], '2026-12-01');
    expect(r.day?.name).toBe('Tracción');
  });
});

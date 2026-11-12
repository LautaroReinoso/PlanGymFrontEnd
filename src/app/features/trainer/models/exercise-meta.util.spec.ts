import { dayExerciseSummary, durationLabel, repsRangeLabel, setsRepsLabel } from './exercise-meta.util';

describe('exercise-meta.util', () => {
  it('durationLabel', () => {
    expect(durationLabel(20)).toBe('20 seg');
    expect(durationLabel(60)).toBe('1 min');
    expect(durationLabel(90)).toBe('1 min 30 seg');
    expect(durationLabel(0)).toBeNull();
  });

  it('setsRepsLabel por tiempo y por repeticiones', () => {
    expect(setsRepsLabel({ sets: 3, reps: 0, durationSeconds: 20 })).toBe('3 × 20 seg');
    expect(setsRepsLabel({ sets: 3, reps: 8, repsMax: 10 })).toBe('3 × ' + repsRangeLabel(8, 10));
  });

  it('dayExerciseSummary suma notas cortas', () => {
    const s = dayExerciseSummary({ sets: 3, reps: 0, durationSeconds: 30, restSeconds: 60, notes: 'Por lado' });
    expect(s).toContain('3 × 30 seg');
    expect(s).toContain('Por lado');
  });
});

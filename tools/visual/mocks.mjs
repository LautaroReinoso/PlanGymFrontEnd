// Datos simulados para las capturas: imitan las respuestas del backend (formas de CLAUDE.md).
// Si cambia un DTO, actualizarlo acá.

const ex = (id, name, mg, sets = 3, reps = 10, extra = {}) => ({
  id, exerciseId: id, exerciseName: name, primaryMuscle: mg, difficulty: 2, imageUrl: '',
  sets, reps, repsMax: reps + 2, restSeconds: 90, weightSuggestion: 20, orderIndex: id, ...extra,
});
const day = (i, name, n) => ({
  id: i, workoutDayId: 100 + i, name, description: '', orderIndex: i, dayNumber: i, workoutTemplateName: 'Fuerza 4 días',
  exercises: [
    ex(1, 'Press de banca plano con barra', 'CHEST'),
    ex(2, 'Remo con mancuerna a una mano', 'BACK'),
    ex(3, 'Sentadilla búlgara', 'QUADRICEPS', 3, 0, { durationSeconds: 40, notes: 'Por pierna' }),
    ex(4, 'Plancha', 'CORE'),
  ].slice(0, n),
});

export const template = {
  id: 7, name: 'Fuerza 4 días — tren superior e inferior', description: 'Bloque de fuerza de 6 semanas', trainerId: 1,
  days: [day(1, 'Empuje', 4), day(2, 'Tracción', 3), day(3, 'Piernas y glúteos con énfasis en cadena posterior', 4), day(4, 'Full body', 2)],
};

const aw = (templateName, dayCount, extra = {}) => ({ startDate: '2026-10-01', templateName, dayCount, ...extra });
export const students = [
  { id: 1, fullName: 'Juan Pérez', dni: '35456123', active: true, activeWorkout: aw(template.name, 4, { workoutTemplateId: 7, studentWorkoutId: 9 }), adherencePercent: 82 },
  { id: 2, fullName: 'María Fernanda Rodríguez de la Fuente', dni: '28111333', active: true, activeWorkout: aw('Hipertrofia', 3, { workoutTemplateId: 8, studentWorkoutId: 11 }), adherencePercent: 55 },
  { id: 3, fullName: null, dni: '40111222', active: true, activeWorkout: null, adherencePercent: null },
  { id: 4, fullName: 'Lucas Díaz', dni: '41222333', active: true, activeWorkout: null, adherencePercent: null },
  { id: 5, fullName: 'Ana Gómez', dni: '39876543', active: true, activeWorkout: aw(template.name, 4, { workoutTemplateId: 7, studentWorkoutId: 10 }), adherencePercent: 25 },
  { id: 6, fullName: 'Pedro Ruiz', dni: '30111444', active: true, activeWorkout: aw('Movilidad', 2, { workoutTemplateId: 9, studentWorkoutId: 12 }), adherencePercent: null },
];

const week = (doneOrder) => ({
  studentWorkoutId: 9, templateName: template.name, today: '2026-11-12', weekStart: '2026-11-09', weekEnd: '2026-11-15',
  currentWeek: true, weekNumber: 3, durationWeeks: null, doneCount: doneOrder.length, totalDays: template.days.length,
  days: template.days.map(d => ({
    workoutDayId: d.workoutDayId, name: d.name, orderIndex: d.orderIndex, exerciseCount: d.exercises.length,
    done: doneOrder.includes(d.orderIndex), completedAt: doneOrder.includes(d.orderIndex) ? '2026-11-10' : null, timesDone: 1,
  })),
});

const bookingStudents = [
  { userId: 1, nextBookingAt: '2026-11-13T18:00:00-03:00', activeEnrollments: [{ dayOfWeek: 1, startTime: '07:00:00' }, { dayOfWeek: 3, startTime: '07:00:00' }] },
  { userId: 2, nextBookingAt: null, activeEnrollments: [{ dayOfWeek: 2, startTime: '19:00:00' }] },
];

/**
 * Rutas simuladas: [regex sobre la URL sin query, (escenario) => { status?, body }].
 * Escenarios: default · noplan (alumno sin plan) · alldone (semana completa) · turnos (módulo de turnos prendido)
 */
export const routes = [
  [/\/booking\/.*\/professional\/students/, s => s === 'turnos' ? { body: bookingStudents } : { status: 403, body: {} }],
  [/\/booking\//, s => s === 'turnos' ? { body: [] } : { status: 403, body: { message: 'Módulo apagado' } }],
  [/\/v1\/users\/students\/\d+$/, () => ({ body: { ...students[0], activeTemplate: template, workoutHistory: [], recentLogs: [] } })],
  [/\/v1\/users\/students$/, () => ({ body: students })],
  [/\/student-workouts\/my-workout\/week/, s => ({ body: week(s === 'alldone' ? [1, 2, 3, 4] : [1]) })],
  [/\/student-workouts\/my-workout\/days$/, () => ({ body: template })],
  [/\/student-workouts\/my-workout$/, s => s === 'noplan'
    ? { status: 404, body: {} }
    : { body: { studentName: 'Juan Pérez', adherencePercent: 82, activeWorkout: aw(template.name, 4) } }],
  [/\/workout-templates\/7$/, () => ({ body: template })],
  [/\/workout-templates$/, () => ({ body: [{ id: 7, name: template.name, dayCount: 4 }] })],
  [/\/workout-logs/, () => ({ body: [] })],
  [/\/exercises$/, () => ({ body: template.days[0].exercises.map((e, i) => ({
    id: e.exerciseId, name: e.exerciseName, primaryMuscle: e.primaryMuscle, difficulty: 2, global: i % 2 === 1, equipment: 'BARBELL' })) })],
  [/./, () => ({ body: [] })],
];

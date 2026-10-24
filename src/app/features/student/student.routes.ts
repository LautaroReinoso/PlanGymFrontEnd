// ─────────────────────────────────────────────
//  GymPlan — Student Routes
//  Lazy loading por página. Protegidas por
//  authGuard + roleGuard('ROLE_STUDENT').
// ─────────────────────────────────────────────

import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { authGuard, roleGuard } from '../../core/auth/services/auth-guard.service';
import { StudentProgressService } from './services/student-progress.service';
import { nextSuggestedDay } from './utils/progress.util';

/** "Hoy": manda al día que le toca esta semana; si ya hizo todos (o no hay plan), a Semana */
const todayRedirect = () => {
  const router = inject(Router);
  return inject(StudentProgressService).getProgress().pipe(
    map(p => {
      const next = nextSuggestedDay(p.days, p.logs);
      return next
        ? router.createUrlTree(['/student/day', next.workoutDayId])
        : router.createUrlTree(['/student/weekly']);
    }),
    catchError(() => of(router.createUrlTree(['/student/dashboard']))),
  );
};

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard('ROLE_STUDENT')],
    loadComponent: () =>
      import('./components/layout/student-layout/student-layout.component').then(
        m => m.StudentLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard-page/dashboard-page.component').then(
            m => m.DashboardPageComponent
          ),
        title: 'Mi entrenamiento — GymPlan',
      },
      {
        // El alumno elige el día desde su plan
        path: 'day/:workoutDayId',
        loadComponent: () =>
          import('./pages/day-page/day-page.component').then(
            m => m.DayPageComponent
          ),
        title: 'Tu entrenamiento — GymPlan',
      },
      // "Hoy" (bottom-nav): resuelve el día que le toca y redirige
      { path: 'daily', canActivate: [todayRedirect], children: [] },
      {
        path: 'weekly',
        loadComponent: () =>
          import('./pages/weekly-page/weekly-page.component').then(m => m.WeeklyPageComponent),
        title: 'Tu semana — GymPlan',
      },
      {
        path: 'monthly',
        loadComponent: () =>
          import('./pages/monthly-page/monthly-page.component').then(m => m.MonthlyPageComponent),
        title: 'Tu historial — GymPlan',
      },
    ],
  },
];

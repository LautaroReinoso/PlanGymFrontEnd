// ─────────────────────────────────────────────
//  PlanGym — Student Routes
//  Lazy loading por página. Protegidas por
//  authGuard + roleGuard('ROLE_STUDENT').
// ─────────────────────────────────────────────

import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { authGuard, roleGuard } from '../../core/auth/services/auth-guard.service';
import { WeekStatusService } from './services/week-status.service';

/** "Hoy": manda al primer día del plan que falta esta semana (lo calcula el backend);
 *  si ya hizo todos, a Semana; si no tiene plan o falla, al inicio. */
const todayRedirect = () => {
  const router = inject(Router);
  return inject(WeekStatusService).load().pipe(
    map(week => {
      const next = [...week.days].sort((a, b) => a.orderIndex - b.orderIndex).find(d => !d.done);
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
        title: 'Mi entrenamiento — PlanGym',
      },
      {
        // El alumno elige el día desde su plan
        path: 'day/:workoutDayId',
        loadComponent: () =>
          import('./pages/day-page/day-page.component').then(
            m => m.DayPageComponent
          ),
        title: 'Tu entrenamiento — PlanGym',
      },
      // "Hoy" (bottom-nav): resuelve el día que le toca y redirige
      { path: 'daily', canActivate: [todayRedirect], children: [] },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent),
        title: 'Mi perfil — PlanGym',
      },
      {
        path: 'weekly',
        loadComponent: () =>
          import('./pages/weekly-page/weekly-page.component').then(m => m.WeeklyPageComponent),
        title: 'Tu semana — PlanGym',
      },
      {
        path: 'monthly',
        loadComponent: () =>
          import('./pages/monthly-page/monthly-page.component').then(m => m.MonthlyPageComponent),
        title: 'Tu historial — PlanGym',
      },
    ],
  },
];

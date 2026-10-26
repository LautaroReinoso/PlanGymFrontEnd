// ─────────────────────────────────────────────
//  PlanGym — Trainer Routes
//  Lazy loading por página.
//  Protegidas por authGuard + roleGuard.
// ─────────────────────────────────────────────

import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/auth/services/auth-guard.service';

export const TRAINER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard('ROLE_TRAINER', 'ROLE_ADMIN', 'ROLE_GYM_ADMIN')],
    loadComponent: () =>
      import('./components/layout/trainer-layout/trainer-layout.component').then(
        m => m.TrainerLayoutComponent
      ),
    children: [

      // ── Redirect raíz → students ─────────────
      {
        path: '',
        redirectTo: 'students',
        pathMatch: 'full',
      },

      // ── Students ─────────────────────────────
      {
        path: 'students',
        loadComponent: () =>
          import('././pages/students-page/students-page/students-page.component').then(
            m => m.StudentsPageComponent
          ),
        title: 'Mis alumnos — PlanGym',
      },
      {
        path: 'students/:id',
        loadComponent: () =>
          import('././pages/students-detail-page/student-detail-page/student-detail-page.component').then(
            m => m.StudentDetailPageComponent
          ),
        title: 'Alumno — PlanGym',
      },

      // ── Exercises ────────────────────────────
      {
        path: 'exercises',
        loadComponent: () =>
          import('././pages/exercises-page/exercises-page/exercises-page.component').then(
            m => m.ExercisesPageComponent
          ),
        title: 'Ejercicios — PlanGym',
      },
      {
        path: 'exercises/:id',
        loadComponent: () =>
          import('./pages/exercise-detail-page/exercise-detail-page/exercise-detail-page.component').then(
            m => m.ExerciseDetailPageComponent
          ),
        title: 'Ejercicio — PlanGym',
      },

      // ── Templates ────────────────────────────
      {
        path: 'templates',
        loadComponent: () =>
          import('./pages/template-list-page/template-list-page.component').then(
            m => m.TemplatesListPageComponent
          ),
        title: 'Plantillas — PlanGym',
      },
      {
        path: 'templates/new',
        loadComponent: () =>
          import('./pages/template-create-page/template-create-page.component').then(
            m => m.TemplateCreatePageComponent
          ),
        title: 'Nueva plantilla — PlanGym',
      },
      {
        path: 'templates/:id',
        loadComponent: () =>
          import('./pages/template-detail-page/template-detail-page.component').then(
            m => m.TemplateDetailPageComponent
          ),
        title: 'Editor de plantilla — PlanGym',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-page/profile-page.component').then((m) => m.TrainerProfilePageComponent),
      title: 'Mi Perfil — PlanGym'
      },

    ],
  },
];
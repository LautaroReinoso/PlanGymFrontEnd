import { Routes } from '@angular/router';
import { loginGuard } from './core/auth/services/auth-guard.service';

export const routes: Routes = [
   {
    path: 'login',
    canActivate: [loginGuard],
    // Sin "mode": se abre el último modo usado (o entrenador por defecto)
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    // Link para compartir con los alumnos
    path: 'login/alumno',
    canActivate: [loginGuard],
    data: { mode: 'student' },
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'login/entrenador',
    canActivate: [loginGuard],
    data: { mode: 'trainer' },
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    // Recuperación de contraseña (solo entrenadores)
    path: 'recuperar-contrasena',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Recuperar contraseña — PlanGym',
  },
  {
    // Link del mail: /reset-password?token=…
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Nueva contraseña — PlanGym',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  }, 
    {
    path: 'trainer',
    loadChildren: () =>
      import('./features/trainer/trainer.routes').then(m => m.TRAINER_ROUTES),
  },
    {
    path: 'student',
    loadChildren: () =>
      import('./features/student/student.routes').then(m => m.STUDENT_ROUTES),
  },
/*      // Redirigir raíz → login (el loginGuard redirige si ya está autenticado)
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
 
  // ── Público ───────────────────────────────
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
 
  // ── Trainer / Admin ───────────────────────
  {
    path: 'trainer',
    canActivate: [authGuard, roleGuard('ROLE_TRAINER', 'ROLE_ADMIN', 'ROLE_GYM_ADMIN')],
    loadComponent: () =>
      import('./features/trainer/layout/trainer-layout.component').then(
        m => m.TrainerLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'students', pathMatch: 'full' },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/trainer/students/student-list.component').then(
            m => m.StudentListComponent
          ),
      },
      {
        path: 'students/:id',
        loadComponent: () =>
          import('./features/trainer/students/student-detail.component').then(
            m => m.StudentDetailComponent
          ),
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('./features/trainer/exercises/exercise-list.component').then(
            m => m.ExerciseListComponent
          ),
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/trainer/workout-templates/template-list.component').then(
            m => m.TemplateListComponent
          ),
      },
      {
        path: 'templates/:id',
        loadComponent: () =>
          import('./features/trainer/workout-templates/template-builder.component').then(
            m => m.TemplateBuilderComponent
          ),
      },
    ],
  },
 
  // ── Student ───────────────────────────────
  {
    path: 'student',
    canActivate: [authGuard, roleGuard('ROLE_STUDENT')],
    loadComponent: () =>
      import('./features/student/layout/student-layout.component').then(
        m => m.StudentLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
      },
      {
        path: 'daily',
        loadComponent: () =>
          import('./features/student/daily/daily-plan.component').then(
            m => m.DailyPlanComponent
          ),
      },
      {
        path: 'weekly',
        loadComponent: () =>
          import('./features/student/weekly/weekly-overview.component').then(
            m => m.WeeklyOverviewComponent
          ),
      },
      {
        path: 'monthly',
        loadComponent: () =>
          import('./features/student/monthly/monthly-calendar.component').then(
            m => m.MonthlyCalendarComponent
          ),
      },
    ],
  },
 
  // ── 404 ───────────────────────────────────
  {
    path: '**',
    redirectTo: 'login',
  }, */
    {
    path: '**',
    redirectTo: 'login',
  }, 
];

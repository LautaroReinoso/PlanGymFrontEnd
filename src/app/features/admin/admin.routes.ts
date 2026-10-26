// ─────────────────────────────────────────────
//  PlanGym — Admin Routes (GLOBAL_ADMIN)
// ─────────────────────────────────────────────

import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/auth/services/auth-guard.service';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    // GYM_ADMIN incluido para evitar un bucle de redirección; la API igual exige GLOBAL_ADMIN.
    canActivate: [authGuard, roleGuard('ROLE_GLOBAL_ADMIN', 'ROLE_GYM_ADMIN')],
    loadComponent: () =>
      import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'trainers', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'trainers', pathMatch: 'full' },
      {
        path: 'trainers',
        loadComponent: () =>
          import('./trainers-page/admin-trainers-page.component').then(m => m.AdminTrainersPageComponent),
        title: 'Entrenadores — PlanGym Admin',
      },
    ],
  },
];

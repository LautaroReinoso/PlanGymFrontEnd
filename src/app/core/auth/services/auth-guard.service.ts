// ─────────────────────────────────────────────
//  GymPlan — Auth Guards
//  Guards funcionales de Angular 19.
//  Protegen rutas según autenticación y rol.
// ─────────────────────────────────────────────

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RoleType } from '../../models/auth/auth.models';

// ── Guard base: requiere sesión activa ──────────
/**
 * Redirige a /login si el usuario no está autenticado
 * o si el token expiró.
 */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
 
  if (auth.isLogged() && auth.isTokenValid()) {
    return true;
  }
 
  return router.createUrlTree(['/login']);
};

// ── Guard de rol: solo accede quien tenga el rol ──
/**
 * Factory que genera un guard para un rol específico.
 * Uso en routes: canActivate: [roleGuard('ROLE_TRAINER')]
 */
export const roleGuard = (...requiredRoles: RoleType[]): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
 
    if (!auth.isLogged() || !auth.isTokenValid()) {
      return router.createUrlTree(['/login']);
    }
 
    if (auth.hasAnyRole(...requiredRoles)) {
      return true;
    }
 
    // Redirigir al dashboard correcto según su rol real
    return router.createUrlTree([getDefaultRoute(auth)]);
  };
};

// ── Guard de login: si ya está logueado, redirigir ──
/**
 * Evita que un usuario autenticado vea la pantalla de login.
 */
// ── Guard de login: redirigir si ya está logueado ──
export const loginGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
 
  if (!auth.isLogged() || !auth.isTokenValid()) {
    return true;
  }
 
  // FIX #6: cubre todos los roles
  return router.createUrlTree([getDefaultRoute(auth)]);
};
// ── Helper: ruta por defecto según rol ─────────
function getDefaultRoute(auth: AuthService): string {
  if (auth.isTrainer() || auth.isAdmin())       return '/trainer/students';
  if (auth.isStudent())                          return '/student/dashboard';
  if (auth.isGlobalAdmin() || auth.isGymAdmin()) return '/admin/trainers';
  return '/login';
}
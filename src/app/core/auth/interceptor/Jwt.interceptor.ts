// ─────────────────────────────────────────────
//  GymPlan — JwtInterceptor
//  Adjunta el token JWT como header Authorization
//  en cada request HTTP saliente (excepto /auth/login).
//  Angular 19: usa la API funcional de interceptores.
// ─────────────────────────────────────────────

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Rutas públicas que NO llevan token
const PUBLIC_URLS = ['/auth/login', '/auth/register', '/auth/student/login'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
 
  const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));
 
  const token = auth.getToken();
  const request = (!isPublic && token)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
 
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // FIX #5: auth.logout() ya navega a /login internamente.
      // No repetir router.navigate() para evitar doble navegación.
      if (error.status === 401 && !isPublic) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
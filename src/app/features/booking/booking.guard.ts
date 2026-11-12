// ─────────────────────────────────────────────
//  PlanGym — bookingEnabledGuard
//  Si el módulo de turnos está apagado (403) no deja entrar.
// ─────────────────────────────────────────────

import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingTrainerService } from './services/booking-trainer.service';
import { BookingStudentService } from './services/booking-student.service';

export const trainerBookingGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(BookingTrainerService).probe().pipe(
    map(ok => ok || router.createUrlTree(['/trainer/students'])));
};

export const studentBookingGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(BookingStudentService).probe().pipe(
    map(ok => ok || router.createUrlTree(['/student/dashboard'])));
};

/** Avisa antes de salir de una pantalla con cambios sin guardar. */
export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges(): boolean }> = component =>
  !component?.hasUnsavedChanges?.() || confirm('Tenés cambios sin guardar en tus horarios. ¿Salir igual?');

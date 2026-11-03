// ─────────────────────────────────────────────
//  PlanGym — billingEnabledGuard
//  Bloquea las rutas de suscripción mientras
//  environment.billingEnabled sea false (período de prueba).
// ─────────────────────────────────────────────

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';

export const billingEnabledGuard: CanActivateFn = () =>
  inject(ENVIRONMENT).billingEnabled || inject(Router).createUrlTree(['/trainer/students']);

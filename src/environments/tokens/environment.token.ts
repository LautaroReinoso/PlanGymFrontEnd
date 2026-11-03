import { InjectionToken } from '@angular/core';
import { environment } from '../environment';
 
export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  appName: string;
  /** Suscripciones del entrenador (Mercado Pago). false = período de prueba, todo oculto. */
  billingEnabled: boolean;
}
 
export const ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT', {
  providedIn: 'root',
  factory: () => environment,
});
 
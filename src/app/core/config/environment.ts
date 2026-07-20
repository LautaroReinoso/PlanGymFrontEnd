import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';
 
export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  appName: string;
}
 
export const ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT', {
  providedIn: 'root',
  factory: () => environment,
});
 
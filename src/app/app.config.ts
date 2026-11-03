import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsAR from '@angular/common/locales/es-AR';
import { provideRouter, withComponentInputBinding  } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptor/Jwt.interceptor';


// Formato es-AR para CurrencyPipe/DatePipe (se pasa explícito en cada pipe)
registerLocaleData(localeEsAR, 'es-AR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
     provideRouter(routes, withComponentInputBinding()),

     
    // HttpClient con el interceptor JWT funcional
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),

    ]
};

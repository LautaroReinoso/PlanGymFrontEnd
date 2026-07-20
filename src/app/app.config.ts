import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding  } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/interceptor/Jwt.interceptor';


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

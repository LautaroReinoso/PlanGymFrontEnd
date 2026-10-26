// ─────────────────────────────────────────────
//  GymPlan — PasswordResetService
//  Recuperación de contraseña (solo trainers).
//  POST /api/auth/password/forgot { mail }        → siempre el mismo mensaje
//  POST /api/auth/password/reset  { token, newPassword }
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';

export interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  forgot(mail: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/auth/password/forgot`, { mail });
  }

  reset(token: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/auth/password/reset`, { token, newPassword });
  }
}

// ─────────────────────────────────────────────
//  PlanGym — AdminService (GLOBAL_ADMIN)
//  GET   /api/admin/trainers
//  PATCH /api/admin/trainers/:id/enabled  { enabled }
//  PATCH /api/admin/users/:id/subscription { active }      (suscripción a mano)
//  GET   /api/booking/plangym/admin/professionals/candidates (sin alta en turnos)
//  POST  /api/booking/plangym/admin/professionals { userId }
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';

export interface AdminTrainer {
  id: number;
  nombre: string | null;
  apellido: string | null;
  mail: string;
  enabled: boolean;
  studentCount: number;
  createdAt: string | null;
  /** Lo trae el backend si AdminTrainerResponse lo incluye; si no, se completa al cambiarlo. */
  subscriptionActive?: boolean | null;
}

export interface ProfessionalCandidate { userId: number; name: string | null; mail: string | null; roles: string[]; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  getTrainers(): Observable<AdminTrainer[]> {
    return this.http.get<AdminTrainer[]>(`${this.api}/admin/trainers`);
  }

  setTrainerEnabled(id: number, enabled: boolean): Observable<AdminTrainer> {
    return this.http.patch<AdminTrainer>(`${this.api}/admin/trainers/${id}/enabled`, { enabled });
  }

  setSubscription(id: number, active: boolean): Observable<{ id: number; subscriptionActive: boolean }> {
    return this.http.patch<{ id: number; subscriptionActive: boolean }>(`${this.api}/admin/users/${id}/subscription`, { active });
  }

  bookingCandidates(): Observable<ProfessionalCandidate[]> {
    return this.http.get<ProfessionalCandidate[]>(`${this.api}/booking/plangym/admin/professionals/candidates`);
  }

  addProfessional(userId: number): Observable<unknown> {
    return this.http.post(`${this.api}/booking/plangym/admin/professionals`, { userId });
  }
}

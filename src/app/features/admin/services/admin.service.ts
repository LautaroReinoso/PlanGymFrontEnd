// ─────────────────────────────────────────────
//  PlanGym — AdminService (GLOBAL_ADMIN)
//  GET   /api/admin/trainers
//  PATCH /api/admin/trainers/:id/enabled  { enabled }
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
}

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
}

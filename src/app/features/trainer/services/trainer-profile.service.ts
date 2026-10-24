import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import {
  ChangePasswordRequest,
  TrainerProfile,
  UpdateTrainerProfileRequest,
} from '../models/trainer.models';

@Injectable({ providedIn: 'root' })
export class TrainerProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(ENVIRONMENT).apiUrl}/trainers/me`;

  getMyProfile(): Observable<TrainerProfile> {
    return this.http.get<TrainerProfile>(this.baseUrl);
  }

  updateMyProfile(body: UpdateTrainerProfileRequest): Observable<TrainerProfile> {
    return this.http.put<TrainerProfile>(this.baseUrl, body);
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/password`, body);
  }
}
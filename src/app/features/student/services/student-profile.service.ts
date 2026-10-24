import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { StudentProfile, UpdateStudentProfileRequest } from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentProfileService {
  private readonly http = inject(HttpClient);
  // Mismo patrón de base URL que StudentWorkoutService (apiUrl ya incluye /api)
  private readonly baseUrl = `${inject(ENVIRONMENT).apiUrl}/students/me`;

  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(this.baseUrl);
  }

  updateMyProfile(body: UpdateStudentProfileRequest): Observable<StudentProfile> {
    return this.http.put<StudentProfile>(this.baseUrl, body);
  }
}
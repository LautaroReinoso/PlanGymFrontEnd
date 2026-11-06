// ─────────────────────────────────────────────
//  PlanGym — BookingTrainerService
//  Turnos del lado del entrenador (/professional/**).
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BookingHttp } from './booking-http.service';
import {
  AgendaItem, Block, BookingService, BookingServiceRequest, BookingStudentSummary,
  EnrollBatchRequest, Enrollment, EnrollmentStatus, ProfessionalMe, Rule, ScheduleOverviewItem,
} from '../models/booking.models';
import { DateRange, splitRange } from '../utils/booking-date.util';

@Injectable({ providedIn: 'root' })
export class BookingTrainerService {
  private readonly api = inject(BookingHttp);

  // ── Agenda ──────────────────────────────────
  /** Agenda del rango visible (se parte en tramos de 92 días si hace falta). */
  agenda(range: DateRange): Observable<AgendaItem[]> {
    const calls = splitRange(range).map(r => this.api.get<AgendaItem[]>('/professional/agenda', r));
    return forkJoin(calls).pipe(map(parts => parts.flat()));
  }

  attendance(present: number[], absent: number[]): Observable<unknown> {
    return this.api.patch('/professional/attendance', { present, absent });
  }

  cancelBooking(id: number, reason: string): Observable<unknown> {
    return this.api.post(`/professional/bookings/${id}/cancel`, { reason });
  }

  // ── Disponibilidad / bloqueos / cupos ───────
  availability(): Observable<{ rules: Rule[] }> {
    return this.api.get<{ rules: Rule[] }>('/professional/availability');
  }

  /** ⚠️ Reemplaza TODAS las reglas. */
  saveAvailability(rules: Rule[]): Observable<{ rules: Rule[] }> {
    return this.api.put<{ rules: Rule[] }>('/professional/availability', { rules });
  }

  blocks(): Observable<Block[]> {
    return this.api.get<Block[]>('/professional/blocks');
  }

  /** 409 si pisa turnos activos; con confirm=true los cancela y avisa a los alumnos. */
  createBlock(body: { startAt: string; endAt: string; reason: string }, confirm = false): Observable<Block> {
    return this.api.post<Block>(`/professional/blocks${confirm ? '?confirm=true' : ''}`, body);
  }

  deleteBlock(id: number): Observable<void> {
    return this.api.delete<void>(`/professional/blocks/${id}`);
  }

  scheduleOverview(): Observable<ScheduleOverviewItem[]> {
    return this.api.get<ScheduleOverviewItem[]>('/professional/schedule-overview');
  }

  // ── Alumnos y horarios fijos ────────────────
  students(q = '', status: 'ACTIVE' | 'ALL' = 'ACTIVE'): Observable<BookingStudentSummary[]> {
    return this.api.get<BookingStudentSummary[]>('/professional/students', { q, status });
  }

  enrollments(filter: { status?: EnrollmentStatus | ''; serviceId?: number | null } = {}): Observable<Enrollment[]> {
    return this.api.get<Enrollment[]>('/professional/enrollments', filter);
  }

  enrollBatch(body: EnrollBatchRequest): Observable<Enrollment[]> {
    return this.api.post<Enrollment[]>('/professional/enrollments/batch', body);
  }

  updateEnrollment(id: number, body: { status?: EnrollmentStatus; validTo?: string | null }): Observable<Enrollment> {
    return this.api.patch<Enrollment>(`/professional/enrollments/${id}`, body);
  }

  // ── Servicios (siempre gratis) ──────────────
  services(): Observable<BookingService[]> {
    return this.api.get<BookingService[]>('/professional/services');
  }

  createService(body: BookingServiceRequest): Observable<BookingService> {
    return this.api.post<BookingService>('/professional/services', { ...body, price: 0 });
  }

  updateService(id: number, body: BookingServiceRequest): Observable<BookingService> {
    return this.api.put<BookingService>(`/professional/services/${id}`, { ...body, price: 0 });
  }

  deleteService(id: number): Observable<void> {
    return this.api.delete<void>(`/professional/services/${id}`);
  }

  // ── Mis datos (tope de recuperaciones) ──────
  me(): Observable<ProfessionalMe> {
    return this.api.get<ProfessionalMe>('/professional/me', undefined, false);
  }

  /** El PUT exige displayName: se manda el actual junto con el cambio. */
  updateMe(body: { displayName: string; recoveriesPerMonth: number }): Observable<ProfessionalMe> {
    return this.api.put<ProfessionalMe>('/professional/me', body);
  }

  /** ¿Está prendido el módulo? (para mostrar "Turnos" en el menú) */
  probe(): Observable<boolean> { return this.api.probe('/professional/services'); }
}

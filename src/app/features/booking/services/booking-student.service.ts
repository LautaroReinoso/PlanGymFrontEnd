// ─────────────────────────────────────────────
//  PlanGym — BookingStudentService
//  Turnos del lado del alumno (siempre con su entrenador).
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BookingHttp } from './booking-http.service';
import {
  Booking, BookingService, CancellationPreview, Enrollment, FreeSlot,
  SelfEnrollmentOptions, SlotRef,
} from '../models/booking.models';
import { DateRange, splitRange } from '../utils/booking-date.util';

@Injectable({ providedIn: 'root' })
export class BookingStudentService {
  private readonly api = inject(BookingHttp);

  // ── Mis clases ──────────────────────────────
  myBookings(range: DateRange): Observable<Booking[]> {
    const calls = splitRange(range).map(r => this.api.get<Booking[]>('/bookings/mine', r));
    return forkJoin(calls).pipe(map(parts => parts.flat()));
  }

  myEnrollments(): Observable<Enrollment[]> {
    return this.api.get<Enrollment[]>('/enrollments/mine');
  }

  /** Clase de horario fijo: "Avisar que no voy" (libera el lugar). */
  absence(id: number): Observable<unknown> {
    return this.api.post(`/bookings/${id}/absence`);
  }

  cancellationPreview(id: number): Observable<CancellationPreview> {
    return this.api.get<CancellationPreview>(`/bookings/${id}/cancellation-preview`, undefined, false);
  }

  cancel(id: number): Observable<unknown> {
    return this.api.post(`/bookings/${id}/cancel`);
  }

  // ── Elegir mis horarios ─────────────────────
  options(serviceId: number): Observable<SelfEnrollmentOptions> {
    return this.api.get<SelfEnrollmentOptions>('/enrollments/options', { serviceId });
  }

  enroll(serviceId: number, slots: SlotRef[]): Observable<Enrollment[]> {
    return this.api.post<Enrollment[]>('/enrollments/mine', { serviceId, slots });
  }

  change(enrollmentId: number, slot: SlotRef): Observable<Enrollment> {
    return this.api.post<Enrollment>(`/enrollments/mine/${enrollmentId}/change`, slot);
  }

  leave(enrollmentId: number): Observable<unknown> {
    return this.api.post(`/enrollments/mine/${enrollmentId}/leave`);
  }

  // ── Clase suelta ────────────────────────────
  services(): Observable<BookingService[]> {
    return this.api.get<BookingService[]>('/services');
  }

  slots(serviceId: number, range: DateRange): Observable<FreeSlot[]> {
    return this.api.get<FreeSlot[]>(`/services/${serviceId}/slots`, range);
  }

  book(serviceId: number, startAt: string): Observable<Booking> {
    return this.api.post<Booking>('/bookings', { serviceId, startAt, acceptPolicy: true });
  }

  probe(): Observable<boolean> { return this.api.probe('/enrollments/mine'); }
}

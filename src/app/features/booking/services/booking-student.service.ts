// ─────────────────────────────────────────────
//  PlanGym — BookingStudentService
//  Turnos del lado del alumno (siempre con su entrenador).
// ─────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ddmm } from '../utils/recovery.util';
import { BookingHttp } from './booking-http.service';
import {
  Booking, BookingService, CancellationPreview, Enrollment, FreeSlot, RecoveryRequest,
  RecoverySummary, ScheduleSlot, SelfEnrollmentOptions, SlotRef, SlotsResponse,
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

  /**
   * Avisa que no va y arma el texto de confirmación con el vencimiento real de esa clase:
   * "Listo. Podés recuperar esta clase hasta el 14/12". Si no generó recuperación (o el
   * resumen falla), un texto neutro. Los 400 (aviso tarde) se propagan con su message.
   */
  absenceWithMessage(id: number): Observable<string> {
    return this.absence(id).pipe(
      switchMap(() => this.recoveries().pipe(catchError(() => of(null)))),
      map(r => {
        const item = r?.items.find(i => i.absenceBookingId === id);
        return item?.expiresAt
          ? `Listo. Podés recuperar esta clase hasta el ${ddmm(item.expiresAt)}.`
          : 'Listo, avisamos que no vas.';
      }),
    );
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

  /** Aplana SlotsResponse a una opción por horario + profesional con lugar. */
  slots(serviceId: number, range: DateRange): Observable<FreeSlot[]> {
    return this.api.get<SlotsResponse>(`/services/${serviceId}/slots`, range).pipe(
      map(res => (res?.slots ?? []).flatMap(s => s.professionals
        .filter(p => p.spotsLeft > 0)
        .map(p => ({
          startAt: s.startAt, endAt: s.endAt,
          professionalId: p.id, professionalName: p.displayName, free: p.spotsLeft,
        })))));
  }

  book(serviceId: number, startAt: string, professionalId?: number): Observable<Booking> {
    return this.api.post<Booking>('/bookings', { serviceId, professionalId, startAt, acceptPolicy: true });
  }

  // ── Recuperar ───────────────────────────────
  /** Horarios del entrenador con cupo (incluye completos). Tramos de ≤42 días. */
  schedule(range: DateRange): Observable<ScheduleSlot[]> {
    const calls = splitRange(range, 42).map(r => this.api.get<ScheduleSlot[]>('/schedule', r));
    return forkJoin(calls).pipe(map(parts => parts.flat().sort((a, b) => a.startAt.localeCompare(b.startAt))));
  }

  /** Recuperaciones vigentes (cada una vence 30 días después de la clase). Ya no recibe ?month. */
  recoveries(): Observable<RecoverySummary> {
    return this.api.get<RecoverySummary>('/recoveries/mine');
  }

  recover(body: RecoveryRequest): Observable<Booking> {
    return this.api.post<Booking>('/recoveries/mine', body);
  }

  probe(): Observable<boolean> { return this.api.probe('/enrollments/mine'); }
}

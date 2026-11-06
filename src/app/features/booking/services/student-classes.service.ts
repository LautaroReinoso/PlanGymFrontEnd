// ─────────────────────────────────────────────
//  PlanGym — StudentClassesService
//  Lo que el resto de la vista del alumno necesita saber de Turnos:
//  si el módulo está prendido, la próxima clase y las clases de un rango.
//  Usa la cache de 60 s de BookingHttp: Inicio, Semana y Día no repiten pedidos.
// ─────────────────────────────────────────────

import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, catchError, shareReplay, switchMap, tap } from 'rxjs';
import { BookingStudentService } from './booking-student.service';
import { Booking } from '../models/booking.models';
import { DateRange, addDays, isPast, isoDateKey, todayKey } from '../utils/booking-date.util';

/** Ventana para buscar la próxima clase */
const UPCOMING_DAYS = 14;

@Injectable({ providedIn: 'root' })
export class StudentClassesService {
  private readonly api = inject(BookingStudentService);

  /** false hasta que el probe confirme que el módulo responde */
  readonly enabled = signal(false);

  /** Probe único por sesión (se comparte entre barra, Inicio, Semana y Día). */
  private readonly ready$ = this.api.probe().pipe(
    tap(ok => this.enabled.set(ok)),
    shareReplay(1),
  );

  /** Dispara el chequeo (la barra inferior lo llama al montarse). */
  init(): void { this.ready$.subscribe(); }

  /** Clases no canceladas del rango, ordenadas. Módulo apagado o error → lista vacía. */
  classesIn(range: DateRange): Observable<Booking[]> {
    return this.ready$.pipe(
      switchMap(ok => ok ? this.api.myBookings(range) : of([] as Booking[])),
      map(list => list
        .filter(b => b.status !== 'CANCELLED')
        .filter(b => { const k = isoDateKey(b.startAt); return k >= range.from && k <= range.to; })
        .sort((a, b) => a.startAt.localeCompare(b.startAt))),
      catchError(() => of([])),
    );
  }

  /** Clases confirmadas que todavía no terminaron (hoy + 13 días). */
  upcoming(): Observable<Booking[]> {
    const from = todayKey();
    return this.classesIn({ from, to: addDays(from, UPCOMING_DAYS - 1) }).pipe(
      map(list => list.filter(b => b.status === 'CONFIRMED' && !isPast(b.endAt))));
  }
}

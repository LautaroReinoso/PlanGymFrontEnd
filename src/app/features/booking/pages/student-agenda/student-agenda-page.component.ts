// ─────────────────────────────────────────────
//  PlanGym — StudentAgendaPage (/student/turnos)
//  Mis clases (semana/mes) + mis horarios fijos.
//  Horario fijo → "Avisar que no voy" · suelta → preview + cancelar.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { BookingStudentService } from '../../services/booking-student.service';
import { Booking, BookingService, DayOfWeek, Enrollment } from '../../models/booking.models';
import { BookingCalendarComponent } from '../../components/calendar/calendar.component';
import { CalEntry } from '../../components/calendar/calendar.models';
import { CalendarView, loadView, saveView } from '../../services/calendar-prefs';
import { toneOf } from '../trainer-agenda/trainer-agenda-page.component';
import {
  STATUS_LABELS, hhmm, isPast, isoDateKey, isoTime, joinDays, longDate, monthGridRange, todayKey, weekRange,
} from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const VIEW_KEY = 'pg.student.calendarView';

@Component({
  selector: 'app-student-agenda-page',
  standalone: true,
  imports: [FormsModule, RouterLink, BookingCalendarComponent, ModalComponent, ButtonComponent],
  templateUrl: './student-agenda-page.component.html',
  styleUrl: './student-agenda-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAgendaPageComponent {
  private readonly api = inject(BookingStudentService);
  private readonly toast = inject(ToastService);

  readonly statusLabels = STATUS_LABELS;

  // Semana por defecto (pensado para el celular)
  readonly view   = signal<CalendarView>(loadView(VIEW_KEY, 'week'));
  readonly anchor = signal(todayKey());
  readonly showCancelled = signal(false);

  readonly bookings    = signal<Booking[]>([]);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly services    = signal<BookingService[]>([]);
  readonly isLoading   = signal(false);
  readonly loadError   = signal<string | null>(null);

  // ── Detalle ──
  readonly openId     = signal<number | null>(null);
  readonly isWorking  = signal(false);
  readonly preview    = signal<string | null>(null);
  readonly confirming = signal(false);
  /** ids que el backend ya dijo que no se pueden tocar (fuera de término) */
  readonly blocked    = signal<Record<number, string>>({});

  readonly range = computed(() =>
    this.view() === 'week' ? weekRange(this.anchor()) : monthGridRange(this.anchor()));

  readonly entries = computed<CalEntry[]>(() =>
    this.bookings()
      .filter(b => this.showCancelled() || b.status !== 'CANCELLED')
      .map(b => ({
        key: String(b.id),
        dateKey: isoDateKey(b.startAt),
        time: isoTime(b.startAt),
        endTime: isoTime(b.endAt),
        title: b.serviceName,
        subtitle: [b.professionalName, b.location].filter(Boolean).join(' · '),
        tone: toneOf(b.status),
        past: isPast(b.endAt),
        fixed: b.enrollmentId != null,
      })));

  /** "Lunes y miércoles 18:00 con Juan" — agrupado por servicio + hora + profe */
  readonly fixedLines = computed(() => {
    const groups = new Map<string, { days: DayOfWeek[]; text: string; paused: boolean }>();
    for (const e of this.enrollments().filter(x => x.status !== 'ENDED')) {
      const key = `${e.serviceId}|${hhmm(e.startTime)}|${e.professionalId}|${e.status}`;
      const g = groups.get(key) ?? {
        days: [], paused: e.status === 'PAUSED',
        text: `${hhmm(e.startTime)} con ${e.professionalName} · ${e.serviceName}`,
      };
      g.days.push(e.dayOfWeek);
      groups.set(key, g);
    }
    return [...groups.values()].map(g => ({ label: `${joinDays(g.days)} ${g.text}`, paused: g.paused }));
  });

  readonly canChoose = computed(() =>
    this.services().some(s => s.selfEnrollment && (s.bookingMode === 'ENROLLMENT' || s.bookingMode === 'BOTH')));
  readonly canBookSingle = computed(() =>
    this.services().some(s => s.bookingMode === 'SELF' || s.bookingMode === 'BOTH'));

  readonly open = computed(() => this.bookings().find(b => b.id === this.openId()) ?? null);
  readonly openTitle = computed(() => {
    const b = this.open();
    return b ? `${b.serviceName} · ${isoTime(b.startAt)}` : '';
  });
  readonly openDate = computed(() => {
    const b = this.open();
    return b ? `${longDate(isoDateKey(b.startAt))}, ${isoTime(b.startAt)} a ${isoTime(b.endAt)}` : '';
  });
  readonly openIsFuture = computed(() => {
    const b = this.open();
    return !!b && b.status === 'CONFIRMED' && !isPast(b.startAt);
  });

  constructor() {
    this.loadFixed();
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.api.myBookings(this.range()).subscribe({
      next: list => { this.bookings.set(list); this.isLoading.set(false); },
      error: err => {
        this.loadError.set(apiErrorText(err, 'No se pudieron cargar tus clases.'));
        this.isLoading.set(false);
      },
    });
  }

  private loadFixed(): void {
    this.api.myEnrollments().pipe(catchError(() => of([]))).subscribe(list => this.enrollments.set(list));
    this.api.services().pipe(catchError(() => of([]))).subscribe(list => this.services.set(list));
  }

  onView(v: CalendarView): void { this.view.set(v); saveView(VIEW_KEY, v); this.load(); }
  onAnchor(a: string): void { this.anchor.set(a); this.load(); }

  openEntry(e: CalEntry): void {
    this.openId.set(Number(e.key));
    this.preview.set(null);
    this.confirming.set(false);
  }

  close(): void { this.openId.set(null); }

  /** Horario fijo: avisar ausencia (libera el lugar). */
  notifyAbsence(): void {
    const b = this.open();
    if (!b) return;
    this.isWorking.set(true);
    this.api.absence(b.id).subscribe({
      next: () => {
        this.isWorking.set(false);
        this.toast.success('Listo, avisamos que no vas. Tu lugar quedó libre.');
        this.close();
        this.load();
      },
      error: err => this.onActionError(b.id, err),
    });
  }

  /** Clase suelta: primero el preview con las condiciones. */
  askCancel(): void {
    const b = this.open();
    if (!b) return;
    this.isWorking.set(true);
    this.api.cancellationPreview(b.id).subscribe({
      next: p => {
        this.isWorking.set(false);
        if (p.allowed === false) { this.blockId(b.id, p.message); return; }
        this.preview.set(p.message);
        this.confirming.set(true);
      },
      error: err => this.onActionError(b.id, err),
    });
  }

  confirmCancel(): void {
    const b = this.open();
    if (!b) return;
    this.isWorking.set(true);
    this.api.cancel(b.id).subscribe({
      next: () => {
        this.isWorking.set(false);
        this.toast.success('Clase cancelada.');
        this.close();
        this.load();
      },
      error: err => this.onActionError(b.id, err),
    });
  }

  private onActionError(id: number, err: unknown): void {
    this.isWorking.set(false);
    const msg = apiErrorText(err);
    // 400/409 = fuera de término o ya no se puede → se deshabilita el botón
    const status = (err as { status?: number })?.status;
    if (status === 400 || status === 409) this.blockId(id, msg);
    else this.toast.error(msg);
  }

  private blockId(id: number, msg: string): void {
    this.blocked.update(b => ({ ...b, [id]: msg }));
    this.confirming.set(false);
  }
}

import { absenceCapNotice, ddmm, expiresSoon, latestRecoveryDeadline, pendingRecoveries, withinRecoveryWindow } from '../../utils/recovery.util';
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
import { Booking, BookingService, DayOfWeek, Enrollment, RecoverySummary, ScheduleSlot } from '../../models/booking.models';
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
  /** Mostrar en el calendario los horarios con lugar (para recuperar) */
  readonly showFree = signal(true);

  readonly bookings    = signal<Booking[]>([]);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly services    = signal<BookingService[]>([]);
  readonly recovery    = signal<RecoverySummary | null>(null);
  /** Horarios del entrenador en el rango visible (con cupo) */
  readonly slots       = signal<ScheduleSlot[]>([]);

  // ── Recuperar desde el calendario ──
  readonly freeSlot    = signal<ScheduleSlot | null>(null);
  readonly isRecovering = signal(false);
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
        subtitle: [b.recoveryOfBookingId ? 'Recuperación' : null, b.professionalName, b.location].filter(Boolean).join(' · '),
        tone: toneOf(b.status),
        past: isPast(b.endAt),
        fixed: b.enrollmentId != null,
      } as CalEntry))
      .concat(this.freeEntries()));

  /** Horarios libres futuros donde no está anotado (tenues; se tocan para recuperar) */
  private readonly freeEntries = computed<CalEntry[]>(() => {
    if (!this.showFree()) return [];
    return this.slots()
      .filter(s => !s.myBookingId && !isPast(s.startAt))
      .map(s => ({
        key: 'free|' + s.startAt + '|' + s.serviceId + '|' + s.professionalId,
        dateKey: isoDateKey(s.startAt),
        time: isoTime(s.startAt),
        endTime: isoTime(s.endAt),
        title: s.serviceName,
        subtitle: s.free > 0 ? 'Libre' : 'Completo',
        meta: s.free > 0 ? s.free + (s.free === 1 ? ' lugar' : ' lugares') : 'Completo',
        tone: 'free',
        past: false,
        free: true,
        full: s.free <= 0,
      } as CalEntry));
  });

  readonly available = computed(() => this.recovery()?.available ?? 0);

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
    this.api.schedule(this.range()).pipe(catchError(() => of([] as ScheduleSlot[])))
      .subscribe(list => this.slots.set(list));
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
    this.loadRecovery();
  }

  private loadRecovery(): void {
    this.api.recoveries().pipe(catchError(() => of(null))).subscribe(r => this.recovery.set(r));
  }

  onView(v: CalendarView): void { this.view.set(v); saveView(VIEW_KEY, v); this.load(); }
  onAnchor(a: string): void { this.anchor.set(a); this.load(); }

  openEntry(e: CalEntry): void {
    if (e.free) {
      const slot = this.slots().find(s => 'free|' + s.startAt + '|' + s.serviceId + '|' + s.professionalId === e.key);
      if (slot) this.freeSlot.set(slot);
      return;
    }
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
    this.api.absenceWithMessage(b.id).subscribe({
      next: msg => {
        this.isWorking.set(false);
        this.toast.success(msg);
        this.close();
        this.load();
        this.loadRecovery();
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
        if (!p.canCancel) { this.blockId(b.id, p.message); return; }
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
        this.toast.success(b.recoveryOfBookingId ? 'Recuperación cancelada: la volvés a tener disponible.' : 'Clase cancelada.');
        this.close();
        this.load();
        this.loadRecovery();
      },
      error: err => this.onActionError(b.id, err),
    });
  }

  // ── Recuperar en un horario libre ──
  /** ¿Puede recuperar en ese horario? (le quedan y cae antes del vencimiento más lejano) */
  readonly freeSlotState = computed<'ok' | 'none' | 'disabled' | 'expired' | 'full'>(() => {
    const s = this.freeSlot(), r = this.recovery();
    if (s && s.free <= 0) return 'full';
    if (!s || !r) return 'none';
    if (r.limit <= 0 && r.available <= 0 && !(r.professionalCancels ?? 0)) return 'disabled';
    if (r.available <= 0) return 'none';
    return withinRecoveryWindow(r, s.startAt) ? 'ok' : 'expired';
  });
  /** Aviso "ya usaste tus 3 de noviembre" para la clase abierta (antes de avisar que no va) */
  readonly openCapNotice = computed(() => {
    const b = this.open();
    return b ? absenceCapNotice(this.recovery(), b.startAt) : null;
  });
  /** Mismo aviso para el mes de hoy (estado vacío de recuperaciones) */
  readonly monthCapNotice = computed(() => absenceCapNotice(this.recovery(), todayKey()));

  readonly recoveryDeadline = computed(() => ddmm(latestRecoveryDeadline(this.recovery())));
  readonly pendingItems = computed(() => pendingRecoveries(this.recovery()));
  readonly earliestExpiry = computed(() => ddmm(this.recovery()?.expiresAt));
  readonly ddmm = ddmm;
  readonly expiresSoon = expiresSoon;
  /** "Tu plan: 12 clases por mes" (monthlyCap del backend; de los servicios en que está anotado) */
  readonly planCaps = computed(() => {
    const mine = new Set(this.enrollments().map(e => e.serviceId));
    const withCap = this.services().filter(s => s.monthlyCap);
    const list = withCap.filter(s => mine.has(s.id));
    return list.length ? list : withCap.length === 1 ? withCap : [];
  });

  freeSlotLabel(s: ScheduleSlot): string {
    return `${longDate(isoDateKey(s.startAt))}, ${isoTime(s.startAt)} a ${isoTime(s.endAt)}`;
  }

  recoverHere(): void {
    const s = this.freeSlot();
    if (!s) return;
    this.isRecovering.set(true);
    this.api.recover({ serviceId: s.serviceId, professionalId: s.professionalId, startAt: s.startAt }).subscribe({
      next: () => {
        this.isRecovering.set(false);
        this.freeSlot.set(null);
        this.toast.success('¡Listo! Quedaste anotado para recuperar.');
        this.load();
        this.loadRecovery();
      },
      error: err => {
        this.isRecovering.set(false);
        this.freeSlot.set(null);
        this.toast.error(apiErrorText(err));
        this.load();
      },
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

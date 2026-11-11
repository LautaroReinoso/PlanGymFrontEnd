import { ddmm } from '../../utils/recovery.util';
// ─────────────────────────────────────────────
//  PlanGym — app-next-class-card (Inicio del alumno)
//  Próxima clase con acción rápida. Sin clases: atajos a elegir/reservar.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { StudentClassesService } from '../../services/student-classes.service';
import { BookingStudentService } from '../../services/booking-student.service';
import { Booking, BookingService, RecoverySummary } from '../../models/booking.models';
import { addDays, isoDateKey, isoTime, longDate, todayKey } from '../../utils/booking-date.util';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

@Component({
  selector: 'app-next-class-card',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './next-class-card.component.html',
  styleUrl: './next-class-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextClassCardComponent {
  private readonly classes = inject(StudentClassesService);
  private readonly api = inject(BookingStudentService);
  private readonly toast = inject(ToastService);

  readonly isLoading  = signal(true);
  readonly upcoming   = signal<Booking[]>([]);
  readonly services   = signal<BookingService[]>([]);
  readonly confirming = signal(false);
  readonly isWorking  = signal(false);
  readonly blockedMsg = signal<string | null>(null);
  readonly recovery   = signal<RecoverySummary | null>(null);

  readonly next = computed(() => this.upcoming()[0] ?? null);
  /** Clases de la semana que viene después de la próxima (para el "y 2 más") */
  readonly moreCount = computed(() => {
    const limit = addDays(todayKey(), 6);
    return this.upcoming().filter(b => isoDateKey(b.startAt) <= limit).length - 1;
  });

  readonly whenLabel = computed(() => {
    const b = this.next();
    if (!b) return '';
    const day = isoDateKey(b.startAt);
    const today = todayKey();
    const prefix = day === today ? 'Hoy' : day === addDays(today, 1) ? 'Mañana' : longDate(day);
    return `${prefix} · ${isoTime(b.startAt)}`;
  });

  readonly canChoose = computed(() =>
    this.services().some(s => s.selfEnrollment && s.bookingMode !== 'SELF'));
  /** "Tu plan: 12 clases por mes" — el tope lo calcula el backend (monthlyCap). */
  readonly planCaps = computed(() => {
    const used = new Set(this.upcoming().map(b => b.serviceId));
    const withCap = this.services().filter(s => s.monthlyCap);
    const mine = withCap.filter(s => used.has(s.id));
    return (mine.length ? mine : withCap.length === 1 ? withCap : []);
  });
  readonly earliestExpiry = computed(() => ddmm(this.recovery()?.expiresAt));

  readonly canBookSingle = computed(() =>
    this.services().some(s => s.bookingMode === 'SELF' || s.bookingMode === 'BOTH'));

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    forkJoin({
      upcoming: this.classes.upcoming(),
      services: this.api.services().pipe(catchError(() => of([] as BookingService[]))),
      recovery: this.api.recoveries().pipe(catchError(() => of(null))),
    }).subscribe(({ upcoming, services, recovery }) => {
      this.upcoming.set(upcoming);
      this.services.set(services);
      this.recovery.set(recovery);
      this.isLoading.set(false);
    });
  }

  absence(): void {
    const b = this.next();
    if (!b) return;
    this.isWorking.set(true);
    this.api.absenceWithMessage(b.id).subscribe({
      next: msg => {
        this.isWorking.set(false);
        this.confirming.set(false);
        this.toast.success(msg);
        this.load();
      },
      error: err => {
        this.isWorking.set(false);
        this.confirming.set(false);
        const msg = apiErrorText(err);
        if (err?.status === 400 || err?.status === 409) this.blockedMsg.set(msg);
        else this.toast.error(msg);
      },
    });
  }
}

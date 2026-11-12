// ─────────────────────────────────────────────
//  PlanGym — StudentBookPage (/student/turnos/reservar)
//  Clase suelta (servicios SELF o BOTH). Sin pago.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';

import { BookingStudentService } from '../../services/booking-student.service';
import { BookingService, FreeSlot } from '../../models/booking.models';
import { addDays, isoDateKey, isoTime, longDate, todayKey } from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const DAYS_AHEAD = 14;

@Component({
  selector: 'app-student-book-page',
  standalone: true,
  imports: [RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './student-book-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentBookPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(BookingStudentService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isoTime = isoTime;
  readonly longDate = longDate;

  readonly services  = signal<BookingService[]>([]);
  readonly serviceId = signal<number | null>(null);
  readonly from      = signal(todayKey());
  readonly slots     = signal<FreeSlot[]>([]);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly chosen    = signal<FreeSlot | null>(null);
  readonly isSaving  = signal(false);

  readonly bookable = computed(() => this.services().filter(s => s.bookingMode === 'SELF' || s.bookingMode === 'BOTH'));
  readonly service  = computed(() => this.services().find(s => s.id === this.serviceId()) ?? null);
  readonly canGoBack = computed(() => this.from() > todayKey());

  readonly byDay = computed(() => {
    const m = new Map<string, FreeSlot[]>();
    for (const s of this.slots()) {
      const k = isoDateKey(s.startAt);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([day, list]) => ({ day, list: list.sort((a, b) => a.startAt.localeCompare(b.startAt)) }));
  });

  constructor() {
    this.api.services().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        this.services.set(list);
        const first = this.bookable()[0];
        if (first) this.selectService(first.id);
      },
      error: err => this.error.set(apiErrorText(err)),
    });
  }

  selectService(id: number): void { this.serviceId.set(id); this.load(); }

  move(step: -1 | 1): void {
    const next = addDays(this.from(), step * DAYS_AHEAD);
    this.from.set(next < todayKey() ? todayKey() : next);
    this.load();
  }

  load(): void {
    const id = this.serviceId();
    if (!id) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.api.slots(id, { from: this.from(), to: addDays(this.from(), DAYS_AHEAD - 1) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => { this.slots.set(list); this.isLoading.set(false); },
      error: err => { this.isLoading.set(false); this.error.set(apiErrorText(err)); },
    });
  }

  /** Aviso del tope mensual del plan (message del 409 del backend) */
  readonly capNotice = signal<string | null>(null);

  book(): void {
    const s = this.chosen(), id = this.serviceId();
    if (!s || !id) return;
    this.isSaving.set(true);
    this.api.book(id, s.startAt, s.professionalId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.chosen.set(null);
        this.toast.success('¡Clase reservada!');
        this.router.navigate(['/student/turnos']);
      },
      error: err => {
        this.isSaving.set(false);
        const msg = apiErrorText(err);
        // 409 por tope mensual del plan: aviso visible (no un error genérico)
        if (err?.status === 409 && /por mes|clases por mes|tu plan/i.test(msg)) {
          this.chosen.set(null);
          this.capNotice.set(msg);
          return;
        }
        this.toast.error(msg);
        this.load();
      },
    });
  }
}

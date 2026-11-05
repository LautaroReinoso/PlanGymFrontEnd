// ─────────────────────────────────────────────
//  PlanGym — app-enroll-student-modal
//  Anotar a un alumno (por DNI) en horario fijo.
//  Se usa desde Horarios fijos y justo después de dar de alta
//  un alumno en "Mis alumnos".
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import { BookingService, DayOfWeek, ScheduleOverviewItem, SlotRef } from '../../models/booking.models';
import { DAY_SHORT, hhmm } from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

@Component({
  selector: 'app-enroll-student-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './enroll-student-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollStudentModalComponent {
  private readonly api = inject(BookingTrainerService);
  private readonly toast = inject(ToastService);

  readonly isOpen = input(false);
  /** DNI precargado (ej. recién creado el alumno) */
  readonly dni    = input<string>('');
  readonly closed = output<void>();
  readonly saved  = output<void>();

  readonly days = [1, 2, 3, 4, 5, 6, 7] as DayOfWeek[];
  readonly dayShort = DAY_SHORT;

  readonly dniValue  = signal('');
  readonly serviceId = signal<number | null>(null);
  readonly validFrom = signal('');
  readonly validTo   = signal('');
  readonly picked    = signal<string[]>([]);   // `${dow}-${HH:mm}`
  readonly services  = signal<BookingService[]>([]);
  readonly slots     = signal<ScheduleOverviewItem[]>([]);
  readonly isSaving  = signal(false);
  readonly error     = signal<string | null>(null);
  readonly loadingData = signal(false);

  /** Servicios de horario fijo */
  readonly fixedServices = computed(() => this.services().filter(s => s.bookingMode !== 'SELF'));

  readonly byDay = computed(() => this.days.map(d => ({
    day: d,
    slots: this.slots().filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })));

  readonly canSave = computed(() =>
    /^\d{6,10}$/.test(this.dniValue().trim()) && !!this.serviceId() && this.picked().length > 0);

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;
      this.dniValue.set(this.dni() ?? '');
      this.picked.set([]);
      this.validFrom.set('');
      this.validTo.set('');
      this.error.set(null);
      this.loadData();
    });
  }

  private loadData(): void {
    this.loadingData.set(true);
    this.api.services().pipe(catchError(() => of([]))).subscribe(list => {
      this.services.set(list);
      const fixed = list.filter(s => s.bookingMode !== 'SELF');
      if (!this.serviceId() && fixed.length) this.serviceId.set(fixed[0].id);
    });
    this.api.scheduleOverview().pipe(catchError(() => of([]))).subscribe(list => {
      this.slots.set(list);
      this.loadingData.set(false);
    });
  }

  slotKey(s: ScheduleOverviewItem): string { return `${s.dayOfWeek}-${hhmm(s.startTime)}`; }
  hhmm = hhmm;

  toggle(s: ScheduleOverviewItem): void {
    const k = this.slotKey(s);
    this.picked.update(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  }

  save(): void {
    if (!this.canSave()) return;
    const slots: SlotRef[] = this.picked().map(k => {
      const [d, t] = k.split('-');
      return { dayOfWeek: Number(d) as DayOfWeek, startTime: t };
    });
    this.isSaving.set(true);
    this.error.set(null);
    this.api.enrollBatch({
      dni: this.dniValue().trim(),
      serviceId: this.serviceId()!,
      slots,
      validFrom: this.validFrom() || undefined,
      validTo: this.validTo() || undefined,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Alumno anotado. Sus clases ya están en el calendario.');
        this.saved.emit();
      },
      error: err => { this.isSaving.set(false); this.error.set(apiErrorText(err)); },
    });
  }
}

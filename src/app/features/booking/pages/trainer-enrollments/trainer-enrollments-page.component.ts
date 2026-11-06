// ─────────────────────────────────────────────
//  PlanGym — TrainerEnrollmentsPage (/trainer/turnos/horarios-fijos)
//  Horarios fijos de los alumnos + Mis servicios (sin precio).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import {
  BookingMode, BookingService, BookingServiceRequest, Enrollment, EnrollmentStatus, ProfessionalMe,
} from '../../models/booking.models';
import { DAY_LABELS, hhmm } from '../../utils/booking-date.util';
import { EnrollStudentModalComponent } from '../../components/enroll-modal/enroll-student-modal.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const STATUS_TEXT: Record<EnrollmentStatus, string> = { ACTIVE: 'Activo', PAUSED: 'En pausa', ENDED: 'Terminado' };
const MODE_TEXT: Record<BookingMode, string> = {
  ENROLLMENT: 'Horario fijo', SELF: 'Clase suelta', BOTH: 'Horario fijo y clase suelta',
};

const EMPTY_SERVICE: BookingServiceRequest = {
  name: '', description: '', durationMinutes: 60, bookingMode: 'ENROLLMENT',
  selfEnrollment: false, weeklyLimit: 2, price: 0,
};

@Component({
  selector: 'app-trainer-enrollments-page',
  standalone: true,
  imports: [FormsModule, RouterLink, EnrollStudentModalComponent, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './trainer-enrollments-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerEnrollmentsPageComponent {
  private readonly api = inject(BookingTrainerService);
  private readonly toast = inject(ToastService);

  readonly statusText = STATUS_TEXT;
  readonly modeText = MODE_TEXT;
  readonly dayLabels = DAY_LABELS;
  readonly hhmm = hhmm;

  readonly enrollments = signal<Enrollment[]>([]);
  readonly services    = signal<BookingService[]>([]);
  readonly isLoading   = signal(false);
  readonly busyId      = signal<number | null>(null);

  readonly statusFilter  = signal<EnrollmentStatus | ''>('ACTIVE');
  readonly serviceFilter = signal<number | null>(null);
  readonly search        = signal('');

  readonly showEnroll = signal(false);

  // fin de horario fijo
  readonly endTarget = signal<Enrollment | null>(null);
  readonly endDate   = signal('');

  // servicio
  readonly editingService = signal<BookingService | null>(null);
  readonly serviceForm    = signal<BookingServiceRequest | null>(null);
  readonly serviceError   = signal<string | null>(null);
  readonly isSavingService = signal(false);
  readonly deleteTarget   = signal<BookingService | null>(null);

  // recuperaciones (tope por mes, del entrenador)
  readonly me = signal<ProfessionalMe | null>(null);
  readonly recoveriesValue = signal<number>(0);
  readonly isSavingMe = signal(false);
  readonly recoveriesDirty = computed(() => (this.me()?.recoveriesPerMonth ?? 0) !== this.recoveriesValue());

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.enrollments()
      .filter(e => !q || (e.clientName ?? '').toLowerCase().includes(q))
      .sort((a, b) => (a.clientName ?? '').localeCompare(b.clientName ?? '')
        || a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  });

  readonly allowsEnrollment = computed(() => {
    const f = this.serviceForm();
    return !!f && (f.bookingMode === 'ENROLLMENT' || f.bookingMode === 'BOTH');
  });

  constructor() {
    this.loadMe();
    this.loadServices();
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.api.enrollments({ status: this.statusFilter(), serviceId: this.serviceFilter() }).subscribe({
      next: list => { this.enrollments.set(list); this.isLoading.set(false); },
      error: err => { this.isLoading.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  loadServices(): void {
    this.api.services().subscribe({
      next: list => this.services.set(list),
      error: err => this.toast.error(apiErrorText(err)),
    });
  }

  loadMe(): void {
    this.api.me().subscribe({
      next: me => { this.me.set(me); this.recoveriesValue.set(me.recoveriesPerMonth ?? 0); },
      error: () => this.me.set(null),
    });
  }

  saveRecoveries(): void {
    const me = this.me();
    const n = Math.max(0, Math.min(31, Math.round(this.recoveriesValue() || 0)));
    if (!me) return;
    this.isSavingMe.set(true);
    this.api.updateMe({ displayName: me.displayName, recoveriesPerMonth: n }).subscribe({
      next: updated => {
        this.isSavingMe.set(false);
        this.me.set(updated);
        this.recoveriesValue.set(updated.recoveriesPerMonth ?? n);
        this.toast.success(n === 0 ? 'Tus alumnos ya no pueden recuperar clases.' : `Listo: hasta ${n} por mes.`);
      },
      error: err => { this.isSavingMe.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  setStatus(s: EnrollmentStatus | ''): void { this.statusFilter.set(s); this.load(); }
  setService(id: number | null): void { this.serviceFilter.set(id); this.load(); }

  nameOf(e: Enrollment): string { return e.clientName?.trim() || 'Sin nombre'; }

  // ── Acciones de horario fijo ──
  setEnrollmentStatus(e: Enrollment, status: EnrollmentStatus): void {
    this.busyId.set(e.id);
    this.api.updateEnrollment(e.id, { status }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(status === 'PAUSED' ? 'Horario en pausa.' : 'Horario reactivado.');
        this.load();
      },
      error: err => { this.busyId.set(null); this.toast.error(apiErrorText(err)); },
    });
  }

  askEnd(e: Enrollment): void { this.endTarget.set(e); this.endDate.set(''); }

  confirmEnd(): void {
    const e = this.endTarget();
    if (!e) return;
    this.busyId.set(e.id);
    const body = this.endDate() ? { validTo: this.endDate() } : { status: 'ENDED' as EnrollmentStatus };
    this.api.updateEnrollment(e.id, body).subscribe({
      next: () => {
        this.busyId.set(null);
        this.endTarget.set(null);
        this.toast.success(this.endDate() ? 'Fecha de fin guardada.' : 'Horario terminado.');
        this.load();
      },
      error: err => { this.busyId.set(null); this.toast.error(apiErrorText(err)); },
    });
  }

  onEnrolled(): void { this.showEnroll.set(false); this.load(); }

  // ── Servicios ──
  newService(): void {
    this.editingService.set(null);
    this.serviceForm.set({ ...EMPTY_SERVICE });
    this.serviceError.set(null);
  }

  editService(s: BookingService): void {
    this.editingService.set(s);
    this.serviceForm.set({
      name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes,
      bookingMode: s.bookingMode, selfEnrollment: !!s.selfEnrollment, weeklyLimit: s.weeklyLimit ?? 2,
      price: 0, active: s.active,
    });
    this.serviceError.set(null);
  }

  patchForm(patch: Partial<BookingServiceRequest>): void {
    this.serviceForm.update(f => f ? { ...f, ...patch } : f);
  }

  saveService(): void {
    const f = this.serviceForm();
    if (!f || !f.name.trim() || !f.durationMinutes) return;
    const body: BookingServiceRequest = {
      ...f,
      name: f.name.trim(),
      price: 0,
      selfEnrollment: this.allowsEnrollment() ? !!f.selfEnrollment : false,
      weeklyLimit: this.allowsEnrollment() ? f.weeklyLimit : null,
    };
    const editing = this.editingService();
    this.isSavingService.set(true);
    (editing ? this.api.updateService(editing.id, body) : this.api.createService(body)).subscribe({
      next: () => {
        this.isSavingService.set(false);
        this.serviceForm.set(null);
        this.toast.success('Servicio guardado.');
        this.loadServices();
      },
      error: err => { this.isSavingService.set(false); this.serviceError.set(apiErrorText(err)); },
    });
  }

  confirmDeleteService(): void {
    const s = this.deleteTarget();
    if (!s) return;
    this.isSavingService.set(true);
    this.api.deleteService(s.id).subscribe({
      next: () => {
        this.isSavingService.set(false);
        this.deleteTarget.set(null);
        this.toast.success('Servicio eliminado.');
        this.loadServices();
      },
      error: err => { this.isSavingService.set(false); this.toast.error(apiErrorText(err)); },
    });
  }
}

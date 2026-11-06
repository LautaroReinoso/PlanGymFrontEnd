// ─────────────────────────────────────────────
//  PlanGym — TrainerEnrollmentsPage (/trainer/turnos/horarios-fijos)
//  Horarios fijos de los alumnos (servicios: TrainerServicesPage).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import {
  BookingService, Enrollment, EnrollmentStatus, ProfessionalMe,
} from '../../models/booking.models';
import { DAY_LABELS, DAY_SHORT, hhmm } from '../../utils/booking-date.util';
import { EnrollStudentModalComponent } from '../../components/enroll-modal/enroll-student-modal.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const STATUS_TEXT: Record<EnrollmentStatus, string> = { ACTIVE: 'Activo', PAUSED: 'En pausa', ENDED: 'Terminado' };

@Component({
  selector: 'app-trainer-enrollments-page',
  standalone: true,
  imports: [FormsModule, RouterLink, EnrollStudentModalComponent, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './trainer-enrollments-page.component.html',
  styleUrl: './trainer-enrollments-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerEnrollmentsPageComponent {
  private readonly api = inject(BookingTrainerService);
  private readonly toast = inject(ToastService);

  readonly statusText = STATUS_TEXT;
  readonly dayLabels = DAY_LABELS;
  readonly dayShort = DAY_SHORT;
  readonly hhmm = hhmm;

  readonly enrollments = signal<Enrollment[]>([]);
  readonly services    = signal<BookingService[]>([]);
  readonly isLoading   = signal(false);
  readonly busyId      = signal<number | null>(null);

  /** CURRENT = activos + en pausa: los dos ocupan lugar y bloquean cambiar la franja */
  readonly statusFilter  = signal<EnrollmentStatus | '' | 'CURRENT'>('CURRENT');
  readonly serviceFilter = signal<number | null>(null);
  readonly search        = signal('');

  readonly showEnroll = signal(false);
  /** Alumno preseleccionado al abrir el modal desde "+ Agregar horario" */
  readonly enrollStudentId = signal<number | null>(null);
  /** Horario fijo tocado en la grilla (abre sus acciones) */
  readonly actionTarget = signal<Enrollment | null>(null);

  // fin de horario fijo
  readonly endTarget = signal<Enrollment | null>(null);
  readonly endDate   = signal('');

  // servicio

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

  /** Una fila por alumno: "Ana López — Lun 07:00 · Mié 07:00 · Vie 07:00" */
  readonly grouped = computed(() => {
    const map = new Map<number, { userId: number; name: string; services: string[]; items: Enrollment[] }>();
    for (const e of this.filtered()) {
      const g = map.get(e.userId) ?? { userId: e.userId, name: this.nameOf(e), services: [], items: [] };
      g.items.push(e);
      if (!g.services.includes(e.serviceName)) g.services.push(e.serviceName);
      map.set(e.userId, g);
    }
    return [...map.values()]
      .map(g => ({ ...g, items: g.items.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    this.loadMe();
    this.loadServices();
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const st = this.statusFilter();
    this.api.enrollments({ status: st === 'CURRENT' ? '' : st, serviceId: this.serviceFilter() }).subscribe({
      next: list => {
        this.enrollments.set(st === 'CURRENT' ? list.filter(e => e.status !== 'ENDED') : list);
        this.isLoading.set(false);
      },
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

  setStatus(s: EnrollmentStatus | '' | 'CURRENT'): void { this.statusFilter.set(s); this.load(); }
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

  openEnroll(userId: number | null = null): void {
    this.enrollStudentId.set(userId);
    this.showEnroll.set(true);
  }

  onEnrolled(): void { this.showEnroll.set(false); this.load(); }

  /** Desde el modal de acciones de un horario */
  act(kind: 'pause' | 'resume' | 'end'): void {
    const e = this.actionTarget();
    if (!e) return;
    this.actionTarget.set(null);
    if (kind === 'end') this.askEnd(e);
    else this.setEnrollmentStatus(e, kind === 'pause' ? 'PAUSED' : 'ACTIVE');
  }
}

// ─────────────────────────────────────────────
//  PlanGym — TrainerEnrollmentsPage (/trainer/turnos/horarios-fijos)
//  Horarios fijos de los alumnos (servicios: TrainerServicesPage).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import {
  BookingService, Enrollment, EnrollmentStatus, ProfessionalMe,
} from '../../models/booking.models';
import { DAY_LABELS, DAY_SHORT, hhmm, todayKey } from '../../utils/booking-date.util';

interface PlanGroup { key: string; userId: number; name: string; serviceId: number; serviceName: string; items: Enrollment[]; }
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
  private readonly destroyRef = inject(DestroyRef);
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

  /** Una fila por alumno y plan: "Ana López · Funcional 2 veces — Lun 07:00 · Jue 07:00" */
  readonly grouped = computed(() => {
    const map = new Map<string, PlanGroup>();
    for (const e of this.filtered()) {
      const key = e.userId + '|' + e.serviceId;
      const g = map.get(key) ?? { key, userId: e.userId, name: this.nameOf(e), serviceId: e.serviceId, serviceName: e.serviceName, items: [] };
      g.items.push(e);
      map.set(key, g);
    }
    return [...map.values()]
      .map(g => ({ ...g, items: g.items.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)) }))
      .sort((a, b) => a.name.localeCompare(b.name) || a.serviceName.localeCompare(b.serviceName));
  });

  /** Alumnos con horarios en más de un plan (datos viejos): se marcan para que el profe los ordene */
  readonly multiPlan = computed(() => {
    const plans = new Map<number, Set<number>>();
    for (const e of this.enrollments()) {
      if (e.status === 'ENDED') continue;
      const s = plans.get(e.userId) ?? new Set<number>();
      s.add(e.serviceId); plans.set(e.userId, s);
    }
    return new Set([...plans].filter(([, s]) => s.size > 1).map(([u]) => u));
  });

  /** Horarios vigentes (activos o en pausa) del grupo: los que cuenta el tope semanal */
  liveCount(g: PlanGroup): number { return g.items.filter(e => e.status !== 'ENDED').length; }
  weeklyLimitOf(serviceId: number): number | null {
    return this.services().find(s => s.id === serviceId)?.weeklyLimit ?? null;
  }
  /** Días que le quedan por elegir según su plan (para ofrecer "Agregar horario") */
  freeDays(g: PlanGroup): number {
    const w = this.weeklyLimitOf(g.serviceId);
    return w ? Math.max(0, w - this.liveCount(g)) : 0;
  }

  // ── Cambiar plan ──
  readonly changeTarget = signal<PlanGroup | null>(null);
  readonly changeTo     = signal<number | null>(null);
  readonly changeFrom   = signal(todayKey());
  readonly changeError  = signal<string | null>(null);
  readonly isChanging   = signal(false);
  readonly today = todayKey();

  /** Planes activos de horario fijo, distintos del actual */
  readonly changeOptions = computed(() => {
    const g = this.changeTarget();
    return this.services().filter(s => s.active !== false
      && (s.bookingMode === 'ENROLLMENT' || s.bookingMode === 'BOTH')
      && s.id !== g?.serviceId);
  });
  /** Aviso preventivo si el plan elegido no alcanza para los horarios que tiene */
  readonly changeShortfall = computed(() => {
    const g = this.changeTarget(), to = this.services().find(s => s.id === this.changeTo());
    if (!g || !to?.weeklyLimit) return null;
    const n = this.liveCount(g);
    return n > to.weeklyLimit
      ? `Este plan es de ${to.weeklyLimit} por semana y el alumno tiene ${n} horarios: quitale ${n - to.weeklyLimit} antes de cambiarlo.`
      : null;
  });
  readonly canConfirmChange = computed(() =>
    !!this.changeTo() && !this.changeShortfall() && !!this.changeFrom() && this.changeFrom() >= this.today && !this.isChanging());

  /** Desde el modal de anotar: cierra ese modal y abre Cambiar plan con los horarios del alumno en ese plan */
  changeFromEnroll(ev: { userId: number; serviceId: number }): void {
    this.showEnroll.set(false);
    const items = this.enrollments().filter(e => e.userId === ev.userId && e.serviceId === ev.serviceId && e.status !== 'ENDED');
    const first = items[0];
    this.openChange({
      key: ev.userId + '|' + ev.serviceId, userId: ev.userId,
      name: first ? this.nameOf(first) : '', serviceId: ev.serviceId,
      serviceName: first?.serviceName ?? this.services().find(s => s.id === ev.serviceId)?.name ?? '',
      items,
    });
  }

  openChange(g: PlanGroup): void {
    this.changeTarget.set(g);
    this.changeTo.set(null);
    this.changeFrom.set(this.today);
    this.changeError.set(null);
  }

  confirmChange(): void {
    const g = this.changeTarget(), to = this.changeTo();
    if (!g || !to || !this.canConfirmChange()) return;
    this.isChanging.set(true);
    this.changeError.set(null);
    this.api.changeService(g.userId, { fromServiceId: g.serviceId, toServiceId: to, from: this.changeFrom() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        this.isChanging.set(false);
        this.changeTarget.set(null);
        const name = list[0]?.serviceName ?? this.services().find(s => s.id === to)?.name ?? '';
        const w = this.weeklyLimitOf(to), n = list.filter(e => e.status !== 'ENDED').length;
        this.toast.success(`Plan cambiado a ${name}` + (w && w > n ? `. Le ${w - n === 1 ? 'queda 1 día' : 'quedan ' + (w - n) + ' días'} por agregar.` : '.'));
        this.load();   // la cache de turnos se invalida en el POST → la agenda también se recarga
      },
      error: err => { this.isChanging.set(false); this.changeError.set(apiErrorText(err, 'No se pudo cambiar el plan.')); },
    });
  }

  constructor() {
    this.loadMe();
    this.loadServices();
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const st = this.statusFilter();
    this.api.enrollments({ status: st === 'CURRENT' ? '' : st, serviceId: this.serviceFilter() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        this.enrollments.set(st === 'CURRENT' ? list.filter(e => e.status !== 'ENDED') : list);
        this.isLoading.set(false);
      },
      error: err => { this.isLoading.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  loadServices(): void {
    this.api.services().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => this.services.set(list),
      error: err => this.toast.error(apiErrorText(err)),
    });
  }

  loadMe(): void {
    this.api.me().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: me => { this.me.set(me); this.recoveriesValue.set(me.recoveriesPerMonth ?? 0); },
      error: () => this.me.set(null),
    });
  }

  saveRecoveries(): void {
    const me = this.me();
    const n = Math.max(0, Math.min(31, Math.round(this.recoveriesValue() || 0)));
    if (!me) return;
    this.isSavingMe.set(true);
    this.api.updateMe({ displayName: me.displayName, recoveriesPerMonth: n }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.api.updateEnrollment(e.id, { status }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.api.updateEnrollment(e.id, body).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

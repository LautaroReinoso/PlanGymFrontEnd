// ─────────────────────────────────────────────
//  PlanGym — app-enroll-student-modal
//  Anotar a un alumno en horario fijo eligiéndolo de la lista
//  de "Mis alumnos" (buscador por nombre o DNI). Se manda userId.
//  Se usa desde Horarios fijos (nuevo o "+ Agregar horario") y
//  justo después de dar de alta un alumno en "Mis alumnos".
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import { BookingService, DayOfWeek, ScheduleOverviewItem, SlotRef } from '../../models/booking.models';
import { DAY_SHORT, hhmm } from '../../utils/booking-date.util';
import { StudentService } from '../../../trainer/services/student.service';
import { StudentSummary } from '../../../trainer/models/trainer.models';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

/** Sin acentos y en minúscula, para buscar */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

@Component({
  selector: 'app-enroll-student-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './enroll-student-modal.component.html',
  styleUrl: './enroll-student-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollStudentModalComponent {
  private readonly api = inject(BookingTrainerService);
  private readonly studentsApi = inject(StudentService);
  private readonly toast = inject(ToastService);

  readonly isOpen    = input(false);
  /** Preseleccionar por DNI (recién dado de alta) */
  readonly dni       = input<string>('');
  /** Preseleccionar por id (desde "+ Agregar horario" de un alumno) */
  readonly studentId = input<number | null>(null);
  readonly closed = output<void>();
  readonly saved  = output<void>();
  /** El alumno ya tiene plan: pedirle a la página que abra "Cambiar plan" */
  readonly changePlan = output<{ userId: number; serviceId: number }>();
  /** 409 "ya está en otro plan": mostrar botón Cambiar plan */
  readonly planConflict = signal(false);

  requestChangePlan(): void {
    const u = this.selectedId(), s = this.currentPlanId() ?? this.serviceId();
    if (u && s) this.changePlan.emit({ userId: u, serviceId: s });
  }

  readonly days = [1, 2, 3, 4, 5, 6, 7] as DayOfWeek[];
  readonly dayShort = DAY_SHORT;
  readonly hhmm = hhmm;

  readonly students   = signal<StudentSummary[]>([]);
  readonly search     = signal('');
  readonly selectedId = signal<number | null>(null);
  readonly serviceId  = signal<number | null>(null);
  readonly validFrom  = signal('');
  readonly validTo    = signal('');
  readonly picked     = signal<string[]>([]);   // `${dow}-${HH:mm}`
  readonly services   = signal<BookingService[]>([]);
  readonly slots      = signal<ScheduleOverviewItem[]>([]);
  /** Franjas en las que el alumno elegido ya está anotado (activo o en pausa) */
  readonly alreadyIn  = signal<Set<string>>(new Set());
  /** Horarios vigentes del alumno elegido (para contar cuántos tiene en cada plan) */
  readonly myEnrollments = signal<{ serviceId: number }[]>([]);
  /** Aviso cuando intenta elegir más días de los que permite el plan */
  readonly limitNotice = signal<string | null>(null);
  readonly isSaving   = signal(false);
  readonly error      = signal<string | null>(null);
  readonly loadingData = signal(false);

  readonly fixedServices = computed(() => this.services().filter(s => s.bookingMode !== 'SELF'));

  readonly selected = computed(() => this.students().find(s => s.id === this.selectedId()) ?? null);

  readonly filteredStudents = computed(() => {
    const q = norm(this.search().trim());
    return this.students()
      .filter(s => !q || norm(s.fullName ?? '').includes(q) || (s.dni ?? '').includes(q))
      .sort((a, b) => this.nameOf(a).localeCompare(this.nameOf(b)));
  });

  readonly byDay = computed(() => this.days.map(d => ({
    day: d,
    slots: this.slots().filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })));

  /** Un alumno tiene un solo plan: si ya tiene horarios, el plan queda fijo (para cambiarlo, "Cambiar plan") */
  readonly currentPlanId = computed(() => this.myEnrollments()[0]?.serviceId ?? null);
  readonly currentPlanName = computed(() => this.services().find(s => s.id === this.currentPlanId())?.name ?? null);

  /** Veces por semana del plan elegido (null = sin tope) */
  readonly weeklyLimit = computed(() => this.services().find(s => s.id === this.serviceId())?.weeklyLimit ?? null);
  /** Horarios que ya tiene en este plan */
  readonly existingInPlan = computed(() => this.myEnrollments().filter(e => e.serviceId === this.serviceId()).length);
  /** Cuántos días más puede elegir (null = sin tope) */
  readonly remaining = computed(() => {
    const w = this.weeklyLimit();
    return w == null ? null : Math.max(0, w - this.existingInPlan() - this.picked().length);
  });
  readonly overLimit = computed(() => {
    const w = this.weeklyLimit();
    return w != null && this.existingInPlan() + this.picked().length > w;
  });

  readonly canSave = computed(() => !!this.selectedId() && !!this.serviceId() && this.picked().length > 0 && !this.overLimit());

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;
      const dni = this.dni();
      const id = this.studentId();
      untracked(() => {
        this.search.set('');
        this.selectedId.set(id);
        this.picked.set([]);
        this.validFrom.set('');
        this.validTo.set('');
        this.error.set(null);
    this.planConflict.set(false);
        this.loadData(dni);
        if (id) this.loadAlreadyIn(id);
        else this.alreadyIn.set(new Set());
      });
    });
  }

  private loadData(dni: string): void {
    this.loadingData.set(true);
    this.studentsApi.getMyStudents().pipe(catchError(() => of([] as StudentSummary[]))).subscribe(list => {
      this.students.set(list);
      if (dni && !this.selectedId()) {
        const match = list.find(s => s.dni === dni);
        if (match) this.select(match);
      }
    });
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

  private loadAlreadyIn(userId: number): void {
    this.api.enrollments({ status: '' }).pipe(catchError(() => of([]))).subscribe(list => {
      const mine = list.filter(e => e.userId === userId && e.status !== 'ENDED');
      this.alreadyIn.set(new Set(mine.map(e => `${e.dayOfWeek}-${hhmm(e.startTime)}`)));
      this.myEnrollments.set(mine.map(e => ({ serviceId: e.serviceId })));
      // Ya tiene plan → se anota en ese mismo plan
      if (mine.length) this.serviceId.set(mine[0].serviceId);
    });
  }

  nameOf(s: StudentSummary): string {
    return s.fullName?.trim() || (s.dni ? `DNI ${s.dni}` : 'Sin nombre');
  }

  select(s: StudentSummary): void {
    this.selectedId.set(s.id);
    this.picked.set([]);
    this.limitNotice.set(null);
    this.myEnrollments.set([]);
    this.loadAlreadyIn(s.id);
  }

  clearStudent(): void {
    this.selectedId.set(null);
    this.alreadyIn.set(new Set());
    this.myEnrollments.set([]);
    this.limitNotice.set(null);
    this.picked.set([]);
  }

  slotKey(s: ScheduleOverviewItem): string { return `${s.dayOfWeek}-${hhmm(s.startTime)}`; }

  isIn(s: ScheduleOverviewItem): boolean { return this.alreadyIn().has(this.slotKey(s)); }

  toggle(s: ScheduleOverviewItem): void {
    if (this.isIn(s)) return;
    const k = this.slotKey(s);
    if (this.picked().includes(k)) {
      this.picked.update(p => p.filter(x => x !== k));
      this.limitNotice.set(null);
      return;
    }
    if (this.remaining() === 0) {
      const svc = this.services().find(x => x.id === this.serviceId());
      const w = this.weeklyLimit()!, had = this.existingInPlan();
      this.limitNotice.set(`${svc?.name ?? 'Este plan'} es de ${w} ${w === 1 ? 'vez' : 'veces'} por semana: solo podés elegir ${w} ${w === 1 ? 'día' : 'días'}`
        + (had ? ` y ya tiene ${had}.` : '.')
        + ' Para sumar más días, usá Cambiar plan.');
      return;
    }
    this.picked.update(p => [...p, k]);
  }

  /** Al cambiar de plan se limpian los días elegidos (el tope cambia) */
  setService(id: number): void {
    this.serviceId.set(id);
    this.picked.set([]);
    this.limitNotice.set(null);
  }

  save(): void {
    if (!this.canSave()) return;
    const slots: SlotRef[] = this.picked().map(k => {
      const [d, t] = k.split('-');
      return { dayOfWeek: Number(d) as DayOfWeek, startTime: t };
    });
    this.isSaving.set(true);
    this.error.set(null);
    this.planConflict.set(false);
    this.api.enrollBatch({
      userId: this.selectedId()!,
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
      error: err => {
        this.isSaving.set(false);
        const msg = apiErrorText(err);
        // 409: ya tiene todos los días de su plan → sugerir cambiar el plan
        this.planConflict.set(err?.status === 409);
        this.error.set(msg);
      },
    });
  }
}

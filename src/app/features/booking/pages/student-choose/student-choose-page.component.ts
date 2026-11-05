// ─────────────────────────────────────────────
//  PlanGym — StudentChoosePage (/student/turnos/elegir)
//  El alumno elige sus horarios fijos (servicios con selfEnrollment).
//  Anotarse = todo o nada. Cambiar o dejar gasta 1 cambio del mes.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingStudentService } from '../../services/booking-student.service';
import { BookingService, DayOfWeek, SelfEnrollmentOptions, SelfSlot } from '../../models/booking.models';
import { DAY_LABELS, DAY_SHORT, hhmm } from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

type Pending =
  | { kind: 'change'; from: SelfSlot; to: SelfSlot }
  | { kind: 'leave'; from: SelfSlot };

@Component({
  selector: 'app-student-choose-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './student-choose-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentChoosePageComponent {
  private readonly api = inject(BookingStudentService);
  private readonly toast = inject(ToastService);

  readonly days = [1, 2, 3, 4, 5, 6, 7] as DayOfWeek[];
  readonly dayShort = DAY_SHORT;
  readonly dayLabels = DAY_LABELS;
  readonly hhmm = hhmm;

  readonly services  = signal<BookingService[]>([]);
  readonly serviceId = signal<number | null>(null);
  readonly options   = signal<SelfEnrollmentOptions | null>(null);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly isSaving  = signal(false);

  /** franjas nuevas elegidas para anotarse */
  readonly picked   = signal<string[]>([]);
  /** franja propia seleccionada (para cambiar o dejar) */
  readonly selected = signal<SelfSlot | null>(null);
  /** modo "elegí a cuál cambiás" */
  readonly changing = signal(false);
  readonly pending  = signal<Pending | null>(null);

  readonly choosable = computed(() => this.services().filter(s =>
    s.selfEnrollment && (s.bookingMode === 'ENROLLMENT' || s.bookingMode === 'BOTH')));

  readonly remaining = computed(() => {
    const o = this.options();
    return o ? Math.max(0, o.weeklyLimit - o.used - this.picked().length) : 0;
  });

  readonly professionals = computed(() => (this.options()?.professionals ?? []).map(p => ({
    ...p,
    byDay: this.days.map(d => ({
      day: d,
      slots: p.slots.filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    })),
  })));

  constructor() {
    this.api.services().subscribe({
      next: list => {
        this.services.set(list);
        const first = this.choosable()[0];
        if (first) this.selectService(first.id);
      },
      error: err => this.error.set(apiErrorText(err)),
    });
  }

  selectService(id: number): void {
    this.serviceId.set(id);
    this.load();
  }

  load(): void {
    const id = this.serviceId();
    if (!id) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.picked.set([]);
    this.selected.set(null);
    this.changing.set(false);
    this.api.options(id).subscribe({
      next: o => { this.options.set(o); this.isLoading.set(false); },
      error: err => { this.isLoading.set(false); this.error.set(apiErrorText(err)); },
    });
  }

  key(s: SelfSlot, profId: number): string { return `${profId}|${s.dayOfWeek}-${hhmm(s.startTime)}`; }

  tap(s: SelfSlot, profId: number): void {
    if (this.isSaving()) return;
    if (s.mine) {
      this.changing.set(false);
      this.selected.set(this.selected() === s ? null : s);
      return;
    }
    if (s.free <= 0) return;
    if (this.changing() && this.selected()) {
      this.pending.set({ kind: 'change', from: this.selected()!, to: s });
      return;
    }
    const k = this.key(s, profId);
    if (this.picked().includes(k)) { this.picked.update(p => p.filter(x => x !== k)); return; }
    if (this.remaining() <= 0) {
      this.toast.info('Ya elegiste todos tus encuentros de la semana. Para otro horario, usá "Cambiar".');
      return;
    }
    this.picked.update(p => [...p, k]);
  }

  enroll(): void {
    const id = this.serviceId();
    if (!id || !this.picked().length) return;
    const slots = this.picked().map(k => {
      const [d, t] = k.split('|')[1].split('-');
      return { dayOfWeek: Number(d) as DayOfWeek, startTime: t };
    });
    this.isSaving.set(true);
    this.api.enroll(id, slots).subscribe({
      next: () => { this.isSaving.set(false); this.toast.success('¡Listo! Ya estás anotado.'); this.load(); },
      error: err => { this.isSaving.set(false); this.toast.error(apiErrorText(err)); this.load(); },
    });
  }

  askLeave(): void {
    const s = this.selected();
    if (s) this.pending.set({ kind: 'leave', from: s });
  }

  confirmPending(): void {
    const p = this.pending();
    if (!p || !p.from.enrollmentId) return;
    this.isSaving.set(true);
    const req = p.kind === 'change'
      ? this.api.change(p.from.enrollmentId, { dayOfWeek: p.to.dayOfWeek, startTime: hhmm(p.to.startTime) })
      : this.api.leave(p.from.enrollmentId);
    req.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.pending.set(null);
        this.toast.success(p.kind === 'change' ? 'Horario cambiado.' : 'Dejaste ese horario.');
        this.load();
      },
      error: err => { this.isSaving.set(false); this.pending.set(null); this.toast.error(apiErrorText(err)); this.load(); },
    });
  }

  slotText(s: SelfSlot): string { return `${DAY_LABELS[s.dayOfWeek]} ${hhmm(s.startTime)}`; }
}

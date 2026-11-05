// ─────────────────────────────────────────────
//  PlanGym — TrainerAvailabilityPage (/trainer/turnos/disponibilidad)
//  Franjas semanales con cupo (PUT reemplaza todas), bloqueos
//  y resumen de cupos por franja.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import { Block, DayOfWeek, Rule, ScheduleOverviewItem } from '../../models/booking.models';
import { DAY_LABELS, DAY_OPTIONS, DAY_SHORT, hhmm, isoDateKey, isoTime, shortDate } from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

type Tab = 'rules' | 'overview' | 'blocks';

/** "2026-11-10T18:00" (input datetime-local) → "2026-11-10T18:00:00-03:00" */
function toArgIso(local: string): string {
  return local.length === 16 ? `${local}:00-03:00` : local;
}

@Component({
  selector: 'app-trainer-availability-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './trainer-availability-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerAvailabilityPageComponent {
  private readonly api = inject(BookingTrainerService);
  private readonly toast = inject(ToastService);

  readonly dayOptions = DAY_OPTIONS;
  readonly dayLabels = DAY_LABELS;
  readonly dayShort = DAY_SHORT;
  readonly days = [1, 2, 3, 4, 5, 6, 7] as DayOfWeek[];
  readonly hhmm = hhmm;

  readonly tab = signal<Tab>('rules');

  // ── Franjas ──
  readonly rules       = signal<Rule[]>([]);
  readonly isLoadingRules = signal(false);
  readonly dirty       = signal(false);
  readonly confirmSave = signal(false);
  readonly isSaving    = signal(false);
  readonly rulesError  = signal<string | null>(null);

  // ── Cupos ──
  readonly overview = signal<ScheduleOverviewItem[]>([]);
  readonly isLoadingOverview = signal(false);
  readonly openSlot = signal<ScheduleOverviewItem | null>(null);

  // ── Bloqueos ──
  readonly blocks = signal<Block[]>([]);
  readonly isLoadingBlocks = signal(false);
  readonly blockFrom = signal('');
  readonly blockTo = signal('');
  readonly blockReason = signal('');
  readonly blockError = signal<string | null>(null);
  readonly busyBlock = signal<number | 'new' | null>(null);

  readonly sortedRules = computed(() =>
    this.rules().map((r, i) => ({ r, i }))
      .sort((a, b) => a.r.dayOfWeek - b.r.dayOfWeek || a.r.startTime.localeCompare(b.r.startTime)));

  readonly rulesValid = computed(() => this.rules().every(r =>
    r.startTime && r.endTime && hhmm(r.startTime) < hhmm(r.endTime) && r.capacity >= 1));

  readonly overviewByDay = computed(() => this.days.map(d => ({
    day: d,
    slots: this.overview().filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })));

  constructor() {
    this.loadRules();
  }

  setTab(t: Tab): void {
    this.tab.set(t);
    if (t === 'overview') this.loadOverview();
    if (t === 'blocks') this.loadBlocks();
  }

  // ── Franjas ──
  loadRules(): void {
    this.isLoadingRules.set(true);
    this.api.availability().subscribe({
      next: res => {
        this.rules.set((res.rules ?? []).map(r => ({ ...r, startTime: hhmm(r.startTime), endTime: hhmm(r.endTime) })));
        this.dirty.set(false);
        this.isLoadingRules.set(false);
      },
      error: err => { this.isLoadingRules.set(false); this.rulesError.set(apiErrorText(err)); },
    });
  }

  addRule(day: DayOfWeek = 1): void {
    const lastOfDay = [...this.rules()].filter(r => r.dayOfWeek === day).sort((a, b) => b.endTime.localeCompare(a.endTime))[0];
    const start = lastOfDay?.endTime ?? '18:00';
    const [h, m] = start.split(':').map(Number);
    const end = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    this.rules.update(list => [...list, { dayOfWeek: day, startTime: start, endTime: end, capacity: lastOfDay?.capacity ?? 10, active: true }]);
    this.dirty.set(true);
  }

  updateRule(index: number, patch: Partial<Rule>): void {
    this.rules.update(list => list.map((r, i) => i === index ? { ...r, ...patch } : r));
    this.dirty.set(true);
  }

  updateDay(index: number, day: number | string): void {
    this.updateRule(index, { dayOfWeek: Number(day) as DayOfWeek });
  }

  duplicateRule(index: number): void {
    const r = this.rules()[index];
    const next = (r.dayOfWeek % 7 + 1) as DayOfWeek;
    this.rules.update(list => [...list, { ...r, id: undefined, dayOfWeek: next }]);
    this.dirty.set(true);
  }

  removeRule(index: number): void {
    this.rules.update(list => list.filter((_, i) => i !== index));
    this.dirty.set(true);
  }

  saveRules(): void {
    this.isSaving.set(true);
    this.rulesError.set(null);
    this.api.saveAvailability(this.rules()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.confirmSave.set(false);
        this.toast.success('Horarios guardados.');
        this.loadRules();
      },
      error: err => {
        this.isSaving.set(false);
        this.confirmSave.set(false);
        this.rulesError.set(apiErrorText(err));
      },
    });
  }

  // ── Cupos ──
  loadOverview(): void {
    this.isLoadingOverview.set(true);
    this.api.scheduleOverview().subscribe({
      next: list => { this.overview.set(list); this.isLoadingOverview.set(false); },
      error: err => { this.isLoadingOverview.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  clientName(n: string | null): string { return n?.trim() || 'Sin nombre'; }

  // ── Bloqueos ──
  loadBlocks(): void {
    this.isLoadingBlocks.set(true);
    this.api.blocks().subscribe({
      next: list => {
        this.blocks.set([...list].sort((a, b) => a.startAt.localeCompare(b.startAt)));
        this.isLoadingBlocks.set(false);
      },
      error: err => { this.isLoadingBlocks.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  blockLabel(b: Block): string {
    const from = isoDateKey(b.startAt), to = isoDateKey(b.endAt);
    return from === to
      ? `${shortDate(from)} · ${isoTime(b.startAt)} a ${isoTime(b.endAt)}`
      : `${shortDate(from)} ${isoTime(b.startAt)} → ${shortDate(to)} ${isoTime(b.endAt)}`;
  }

  createBlock(): void {
    const from = this.blockFrom(), to = this.blockTo();
    if (!from || !to) return;
    if (to <= from) { this.blockError.set('El fin tiene que ser después del inicio.'); return; }
    this.busyBlock.set('new');
    this.blockError.set(null);
    this.api.createBlock({ startAt: toArgIso(from), endAt: toArgIso(to), reason: this.blockReason().trim() }).subscribe({
      next: () => {
        this.busyBlock.set(null);
        this.blockFrom.set(''); this.blockTo.set(''); this.blockReason.set('');
        this.toast.success('Bloqueo creado.');
        this.loadBlocks();
      },
      error: err => { this.busyBlock.set(null); this.blockError.set(apiErrorText(err)); },
    });
  }

  deleteBlock(b: Block): void {
    this.busyBlock.set(b.id);
    this.api.deleteBlock(b.id).subscribe({
      next: () => { this.busyBlock.set(null); this.toast.success('Bloqueo eliminado.'); this.loadBlocks(); },
      error: err => { this.busyBlock.set(null); this.toast.error(apiErrorText(err)); },
    });
  }
}

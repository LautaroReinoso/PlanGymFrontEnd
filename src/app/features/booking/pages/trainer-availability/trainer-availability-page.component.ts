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

interface RuleEditor {
  mode: 'add' | 'edit';
  index: number | null;          // índice en rules() si es edición
  start: string;                 // "HH:mm"
  duration: number;              // minutos
  customDuration: boolean;
  capacity: number;
  days: DayOfWeek[];
}

function toMin(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minutesBetween(a: string, b: string): number { return toMin(b) - toMin(a); }
/** "18:00" + 60 → "19:00" (tope 23:59, las franjas no cruzan medianoche) */
function addMinutes(t: string, mins: number): string {
  const total = Math.min(toMin(t) + mins, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
const CAPACITY_KEY = 'pg.trainer.lastCapacity';
function loadCapacity(): number {
  try { const n = Number(localStorage.getItem(CAPACITY_KEY)); return n >= 1 ? n : 10; } catch { return 10; }
}
function saveCapacity(n: number): void {
  try { localStorage.setItem(CAPACITY_KEY, String(n)); } catch { /* sin storage */ }
}

@Component({
  selector: 'app-trainer-availability-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './trainer-availability-page.component.html',
  styleUrl: './trainer-availability-page.component.css',
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
  /** Guardado automático: estado para el indicador */
  readonly saveState   = signal<'idle' | 'saving' | 'saved'>('idle');

  // ── Editor de franja (agregar / editar) ──
  readonly durations = [45, 60, 90];
  readonly editor = signal<RuleEditor | null>(null);
  /** Borrar con alumnos anotados → confirmar */
  readonly deleteTarget = signal<{ index: number; rule: Rule; enrolled: number } | null>(null);
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
  /** 409: el bloqueo pisa clases → pedir confirmación (cancela y avisa) */
  readonly blockConflict = signal<string | null>(null);

  /** Columnas lun–dom con sus franjas ordenadas (guardando el índice real en rules()) */
  readonly rulesByDay = computed(() => this.days.map(d => ({
    day: d,
    items: this.rules().map((r, i) => ({ r, i }))
      .filter(x => x.r.dayOfWeek === d)
      .sort((a, b) => a.r.startTime.localeCompare(b.r.startTime)),
  })));

  /** Alumnos con horario fijo por franja (del resumen de cupos) */
  private readonly enrolledByKey = computed(() =>
    new Map(this.overview().map(o => [`${o.dayOfWeek}-${hhmm(o.startTime)}`, o.enrolled])));

  readonly editorEnd = computed(() => {
    const e = this.editor();
    return e ? addMinutes(e.start, e.duration) : '';
  });
  readonly editorValid = computed(() => {
    const e = this.editor();
    return !!e && /^\d\d:\d\d$/.test(e.start) && e.duration >= 10 && e.capacity >= 1 && e.days.length > 0
      && this.editorEnd() > e.start;
  });

  readonly overviewByDay = computed(() => this.days.map(d => ({
    day: d,
    slots: this.overview().filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })));

  constructor() {
    this.loadRules();
    this.loadOverview();
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
        this.isLoadingRules.set(false);
      },
      error: err => { this.isLoadingRules.set(false); this.rulesError.set(apiErrorText(err)); },
    });
  }

  enrolledIn(r: Rule): number {
    return this.enrolledByKey().get(`${r.dayOfWeek}-${hhmm(r.startTime)}`) ?? 0;
  }

  durationOf(r: Rule): number { return minutesBetween(r.startTime, r.endTime); }

  openAdd(day: DayOfWeek): void {
    const last = [...this.rules()].filter(r => r.dayOfWeek === day)
      .sort((a, b) => b.endTime.localeCompare(a.endTime))[0];
    const duration = last ? this.durationOf(last) : 60;
    this.editor.set({
      mode: 'add', index: null,
      start: last?.endTime ?? '18:00',
      duration, customDuration: !this.durations.includes(duration),
      capacity: loadCapacity(), days: [day],
    });
  }

  openEdit(index: number): void {
    const r = this.rules()[index];
    const duration = this.durationOf(r);
    this.editor.set({
      mode: 'edit', index, start: r.startTime, duration,
      customDuration: !this.durations.includes(duration), capacity: r.capacity, days: [r.dayOfWeek],
    });
  }

  patchEditor(patch: Partial<RuleEditor>): void {
    this.editor.update(e => e ? { ...e, ...patch } : e);
  }

  toggleDay(d: DayOfWeek): void {
    const e = this.editor();
    if (!e || e.mode === 'edit') return;
    this.patchEditor({ days: e.days.includes(d) ? e.days.filter(x => x !== d) : [...e.days, d] });
  }

  setDays(kind: 'weekdays' | 'all'): void {
    this.patchEditor({ days: (kind === 'all' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5]) as DayOfWeek[] });
  }

  saveEditor(): void {
    const e = this.editor();
    if (!e || !this.editorValid()) return;
    const end = this.editorEnd();
    saveCapacity(e.capacity);
    let next: Rule[];
    let skipped = 0;
    if (e.mode === 'edit' && e.index !== null) {
      next = this.rules().map((r, i) => i === e.index ? { ...r, startTime: e.start, endTime: end, capacity: e.capacity } : r);
    } else {
      const existing = new Set(this.rules().map(r => `${r.dayOfWeek}-${r.startTime}`));
      const added: Rule[] = [];
      for (const d of [...e.days].sort()) {
        if (existing.has(`${d}-${e.start}`)) { skipped++; continue; }
        added.push({ dayOfWeek: d, startTime: e.start, endTime: end, capacity: e.capacity, active: true });
      }
      next = [...this.rules(), ...added];
    }
    this.persist(next, () => {
      this.editor.set(null);
      if (skipped) this.toast.info(`${skipped} ${skipped === 1 ? 'día ya tenía' : 'días ya tenían'} ese horario: no se duplicó.`);
    });
  }

  askRemove(index: number): void {
    const rule = this.rules()[index];
    const enrolled = this.enrolledIn(rule);
    if (enrolled > 0) this.deleteTarget.set({ index, rule, enrolled });
    else this.remove(index);
  }

  remove(index: number): void {
    this.persist(this.rules().filter((_, i) => i !== index), () => this.deleteTarget.set(null));
  }

  /** Guardado automático: el PUT reemplaza todas las franjas por `next`. */
  private persist(next: Rule[], onOk?: () => void): void {
    const prev = this.rules();
    this.rules.set(next);               // se ve al instante
    this.isSaving.set(true);
    this.saveState.set('saving');
    this.rulesError.set(null);
    this.api.saveAvailability(next).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveState.set('saved');
        onOk?.();
        this.loadRules();               // ids reales del backend
        this.loadOverview();
      },
      error: err => {
        this.isSaving.set(false);
        this.saveState.set('idle');
        this.rules.set(prev);           // vuelve atrás
        this.toast.error(apiErrorText(err, 'No se pudo guardar el horario.'));
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

  createBlock(confirm = false): void {
    const from = this.blockFrom(), to = this.blockTo();
    if (!from || !to) return;
    if (to <= from) { this.blockError.set('El fin tiene que ser después del inicio.'); return; }
    this.busyBlock.set('new');
    this.blockError.set(null);
    this.api.createBlock({ startAt: toArgIso(from), endAt: toArgIso(to), reason: this.blockReason().trim() }, confirm).subscribe({
      next: () => {
        this.busyBlock.set(null);
        this.blockConflict.set(null);
        this.blockFrom.set(''); this.blockTo.set(''); this.blockReason.set('');
        this.toast.success('Bloqueo creado.');
        this.loadBlocks();
      },
      error: err => {
        this.busyBlock.set(null);
        if (err?.status === 409 && !confirm) this.blockConflict.set(apiErrorText(err));
        else this.blockError.set(apiErrorText(err));
      },
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

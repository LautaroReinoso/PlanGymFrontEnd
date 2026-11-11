// ─────────────────────────────────────────────
//  PlanGym — TrainerAgendaPage (/trainer/turnos)
//  Calendario del entrenador agrupado por clase
//  (startAt + serviceId), detalle, pasar lista y cancelar.
//  Después de cada acción se recarga el rango visible.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import { AgendaItem, BookingStatus } from '../../models/booking.models';
import { BookingCalendarComponent } from '../../components/calendar/calendar.component';
import { CalEntry, CalTone } from '../../components/calendar/calendar.models';
import { CalendarView, loadView, saveView } from '../../services/calendar-prefs';
import {
  STATUS_LABELS, hhmm, isPast, isoDateKey, isoDow, isoTime, longDate, monthGridRange, todayKey, weekRange,
} from '../../utils/booking-date.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const VIEW_KEY = 'pg.trainer.calendarView';

interface ClassGroup {
  key: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  items: AgendaItem[];
  capacity: number | null;
}

type Mark = 'present' | 'absent' | null;

export function toneOf(s: BookingStatus): CalTone {
  return s === 'COMPLETED' ? 'completed' : s === 'NO_SHOW' ? 'noshow' : s === 'CANCELLED' ? 'cancelled' : 'confirmed';
}

@Component({
  selector: 'app-trainer-agenda-page',
  standalone: true,
  imports: [FormsModule, RouterLink, BookingCalendarComponent, ModalComponent, ButtonComponent],
  templateUrl: './trainer-agenda-page.component.html',
  styleUrl: './trainer-agenda-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerAgendaPageComponent {
  private readonly api = inject(BookingTrainerService);
  private readonly toast = inject(ToastService);

  readonly statusLabels = STATUS_LABELS;
  readonly isoTime = isoTime;

  readonly view   = signal<CalendarView>(loadView(VIEW_KEY, 'week'));
  readonly anchor = signal(todayKey());
  readonly showCancelled = signal(false);

  readonly items     = signal<AgendaItem[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  /** cupo por franja: `${dow}-${HH:mm}` → capacity (del resumen de cupos) */
  private readonly capacityMap = signal<Map<string, number>>(new Map());

  // ── Detalle de clase ──
  readonly openKey  = signal<string | null>(null);
  readonly marks    = signal<Record<number, Mark>>({});
  readonly isSaving = signal(false);
  readonly cancelId = signal<number | null>(null);
  readonly cancelReason = signal('');

  readonly range = computed(() =>
    this.view() === 'week' ? weekRange(this.anchor()) : monthGridRange(this.anchor()));

  readonly groups = computed<ClassGroup[]>(() => {
    const map = new Map<string, ClassGroup>();
    for (const it of this.items()) {
      const key = `${it.startAt}|${it.serviceId}`;
      let g = map.get(key);
      if (!g) {
        const cap = this.capacityMap().get(`${isoDow(isoDateKey(it.startAt))}-${isoTime(it.startAt)}`) ?? null;
        g = { key, serviceName: it.serviceName, startAt: it.startAt, endAt: it.endAt, items: [], capacity: cap };
        map.set(key, g);
      }
      g.items.push(it);
    }
    return [...map.values()];
  });

  readonly entries = computed<CalEntry[]>(() =>
    this.groups()
      .map(g => {
        const active = g.items.filter(i => i.status !== 'CANCELLED');
        const allCancelled = active.length === 0;
        return {
          key: g.key,
          dateKey: isoDateKey(g.startAt),
          time: isoTime(g.startAt),
          endTime: isoTime(g.endAt),
          title: g.serviceName,
          subtitle: allCancelled ? 'Cancelada' : `${active.length} ${active.length === 1 ? 'alumno' : 'alumnos'}`,
          meta: g.capacity ? `${active.length}/${g.capacity}` : undefined,
          people: active.length,
          tone: allCancelled ? 'cancelled' : this.groupTone(active),
          past: isPast(g.endAt),
          fixed: g.items.some(i => i.enrollmentId != null),
          full: !allCancelled && !!g.capacity && active.length >= g.capacity,
        } as CalEntry;
      })
      .filter(e => this.showCancelled() || e.tone !== 'cancelled'));

  readonly openGroup = computed(() => this.groups().find(g => g.key === this.openKey()) ?? null);
  readonly openTitle = computed(() => {
    const g = this.openGroup();
    return g ? `${g.serviceName} · ${isoTime(g.startAt)}` : '';
  });
  readonly openDate = computed(() => {
    const g = this.openGroup();
    return g ? `${longDate(isoDateKey(g.startAt))}, ${isoTime(g.startAt)} a ${isoTime(g.endAt)}` : '';
  });
  readonly openStarted = computed(() => {
    const g = this.openGroup();
    return !!g && isPast(g.startAt);
  });
  readonly openRows = computed(() => {
    const g = this.openGroup();
    if (!g) return [];
    return [...g.items]
      .filter(i => this.showCancelled() || i.status !== 'CANCELLED')
      .sort((a, b) => this.nameOf(a).localeCompare(this.nameOf(b)));
  });
  readonly hasMarks = computed(() => Object.values(this.marks()).some(m => m !== null));

  constructor() {
    this.loadCapacities();
    this.load();
  }

  // ── Carga ──
  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.api.agenda(this.range()).subscribe({
      next: list => { this.items.set(list); this.isLoading.set(false); },
      error: err => {
        this.loadError.set(apiErrorText(err, 'No se pudo cargar la agenda.'));
        this.isLoading.set(false);
      },
    });
  }

  private loadCapacities(): void {
    this.api.scheduleOverview().pipe(catchError(() => of([]))).subscribe(list => {
      this.capacityMap.set(new Map(list.map(r => [`${r.dayOfWeek}-${hhmm(r.startTime)}`, r.capacity])));
    });
  }

  onView(v: CalendarView): void { this.view.set(v); saveView(VIEW_KEY, v); this.load(); }
  onAnchor(a: string): void { this.anchor.set(a); this.load(); }

  // ── Detalle ──
  openEntry(e: CalEntry): void {
    this.openKey.set(e.key);
    this.marks.set({});
    this.cancelId.set(null);
  }

  closeDetail(): void { this.openKey.set(null); }

  nameOf(i: AgendaItem): string { return i.client?.name?.trim() || 'Sin nombre'; }

  markOf(i: AgendaItem): Mark {
    const m = this.marks()[i.id];
    if (m !== undefined) return m;
    return i.status === 'COMPLETED' ? 'present' : i.status === 'NO_SHOW' ? 'absent' : null;
  }

  setMark(i: AgendaItem, m: Mark): void {
    this.marks.update(all => ({ ...all, [i.id]: this.markOf(i) === m ? null : m }));
  }

  allPresent(): void {
    const next: Record<number, Mark> = {};
    for (const i of this.openRows()) if (i.status !== 'CANCELLED') next[i.id] = 'present';
    this.marks.set(next);
  }

  saveAttendance(): void {
    const present: number[] = [], absent: number[] = [];
    for (const i of this.openRows()) {
      if (i.status === 'CANCELLED') continue;
      const m = this.markOf(i);
      if (m === 'present') present.push(i.id);
      if (m === 'absent') absent.push(i.id);
    }
    if (!present.length && !absent.length) return;
    this.isSaving.set(true);
    this.api.attendance(present, absent).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.marks.set({});
        this.toast.success('Lista guardada.');
        this.load();
      },
      error: err => { this.isSaving.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  askCancel(i: AgendaItem): void { this.cancelId.set(i.id); this.cancelReason.set(''); }

  confirmCancel(): void {
    const id = this.cancelId();
    const reason = this.cancelReason().trim();
    if (!id || !reason) return;
    this.isSaving.set(true);
    this.api.cancelBooking(id, reason).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelId.set(null);
        this.toast.success('Turno cancelado.');
        this.load();
      },
      error: err => { this.isSaving.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  private groupTone(active: AgendaItem[]): CalTone {
    if (active.every(i => i.status === 'NO_SHOW')) return 'noshow';
    if (active.some(i => i.status === 'COMPLETED' || i.status === 'NO_SHOW')) return 'completed';
    return 'confirmed';
  }
}

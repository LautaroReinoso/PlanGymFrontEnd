// ─────────────────────────────────────────────
//  PlanGym — app-booking-calendar
//  Grilla propia Semana / Mes. Controlada por el padre
//  (anchor + view) para que el padre pida el rango visible.
//  Semana: 7 columnas en desktop, días apilados en celular.
//  Mes: solo contadores por día; al tocar un día se lista abajo.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CalEntry } from './calendar.models';
import { CalendarView } from '../../services/calendar-prefs';
import {
  DAY_SHORT, addDays, addMonths, fromKey, listDays, longDate, monthGridRange, monthTitle,
  todayKey, weekRange, weekTitle,
} from '../../utils/booking-date.util';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [PageLoaderComponent, NgTemplateOutlet],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCalendarComponent {
  readonly view    = input<CalendarView>('week');
  readonly anchor  = input<string>(todayKey());
  readonly entries = input<CalEntry[]>([]);
  readonly loading = input(false);
  /** Texto del resumen del mes: "alumnos" (trainer) o nada (alumno) */
  readonly showPeople = input(false);
  readonly emptyText  = input('No hay clases en estos días.');

  readonly viewChange   = output<CalendarView>();
  readonly anchorChange = output<string>();
  readonly entryClick   = output<CalEntry>();

  readonly today = todayKey();
  readonly dayShort = DAY_SHORT;
  readonly longDate = longDate;
  readonly selectedDay = signal<string | null>(null);

  readonly title = computed(() =>
    this.view() === 'week' ? weekTitle(weekRange(this.anchor())) : monthTitle(this.anchor()));

  private readonly byDay = computed(() => {
    const m = new Map<string, CalEntry[]>();
    for (const e of this.entries()) {
      const list = m.get(e.dateKey) ?? [];
      list.push(e);
      m.set(e.dateKey, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return m;
  });

  readonly weekDays = computed(() =>
    listDays(weekRange(this.anchor())).map(key => ({
      key, dow: fromKey(key).getDay() || 7, num: fromKey(key).getDate(),
      entries: this.byDay().get(key) ?? [],
    })));

  readonly monthCells = computed(() => {
    const month = this.anchor().slice(0, 7);
    return listDays(monthGridRange(this.anchor())).map(key => {
      const all = this.byDay().get(key) ?? [];
      const entries = all.filter(e => e.tone !== 'cancelled' && !e.free);
      return {
        key, num: fromKey(key).getDate(), inMonth: key.startsWith(month),
        classes: entries.length,
        freeSlots: all.filter(e => e.free).length,
        people: entries.reduce((s, e) => s + (e.people ?? 0), 0),
      };
    });
  });

  readonly selectedEntries = computed(() => {
    const d = this.selectedDay();
    return d ? this.byDay().get(d) ?? [] : [];
  });

  readonly isEmpty = computed(() => !this.loading() && this.entries().length === 0);

  setView(v: CalendarView): void { if (v !== this.view()) this.viewChange.emit(v); }

  move(step: -1 | 1): void {
    this.selectedDay.set(null);
    this.anchorChange.emit(this.view() === 'week'
      ? addDays(this.anchor(), step * 7)
      : addMonths(this.anchor(), step));
  }

  goToday(): void {
    this.selectedDay.set(this.view() === 'month' ? this.today : null);
    this.anchorChange.emit(this.today);
  }

  pickDay(key: string): void {
    this.selectedDay.set(this.selectedDay() === key ? null : key);
  }
}

// ─────────────────────────────────────────────
//  PlanGym — TrainerTodayPage (/trainer/hoy) — mobile first
//  Quiénes vienen hoy (agenda del día, agrupada por clase) y,
//  al tocar un alumno, su plan del día con "Marcar como hecho".
//  "Le toca": mismo criterio que el "Hoy" del alumno → el día que ya
//  marcó hoy o, si no, el primer día del plan pendiente esta semana.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import { AgendaItem } from '../../models/booking.models';
import { isPast, isoTime, longDate, todayKey } from '../../utils/booking-date.util';
import { todayPlan } from '../../utils/today-plan.util';
import { TrainerWorkoutLog, TrainerWorkoutLogService } from '../../../trainer/services/trainer-workout-log.service';
import { StudentDetail } from '../../../trainer/models/student.models';
import { WorkoutTemplateDay } from '../../../trainer/models/trainer.models';
import { dayExerciseSummary } from '../../../trainer/models/exercise-meta.util';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ExerciseItemComponent } from '../../../../shared/components/exercise-item/exercise-item.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

interface StudentToday {
  loading: boolean;
  detail: StudentDetail | null;
  logs: TrainerWorkoutLog[];
  error: boolean;
}

interface TodayState {
  kind: 'loading' | 'noPlan' | 'doneToday' | 'next' | 'weekDone' | 'error';
  day: WorkoutTemplateDay | null;
  label: string;
}

@Component({
  selector: 'app-trainer-today-page',
  standalone: true,
  imports: [RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent, ExerciseItemComponent],
  templateUrl: './trainer-today-page.component.html',
  styleUrl: './trainer-today-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerTodayPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(BookingTrainerService);
  private readonly logsApi = inject(TrainerWorkoutLogService);
  private readonly toast = inject(ToastService);

  readonly today = todayKey();
  readonly title = longDate(this.today);
  readonly isoTime = isoTime;
  readonly summary = dayExerciseSummary;

  readonly items     = signal<AgendaItem[]>([]);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);
  /** Datos de plan por alumno (userId) */
  readonly students  = signal<Record<number, StudentToday>>({});

  // ── Detalle ──
  readonly openUserId  = signal<number | null>(null);
  readonly openDayId   = signal<number | null>(null);   // workoutDayId elegido
  readonly isMarking   = signal(false);

  /** Clases de hoy (sin canceladas), agrupadas por hora + servicio */
  readonly classes = computed(() => {
    const map = new Map<string, { key: string; time: string; endTime: string; service: string; past: boolean; people: AgendaItem[] }>();
    for (const it of this.items()) {
      if (it.status === 'CANCELLED') continue;
      const key = `${it.startAt}|${it.serviceId}`;
      const g = map.get(key) ?? {
        key, time: isoTime(it.startAt), endTime: isoTime(it.endAt), service: it.serviceName,
        past: isPast(it.endAt), people: [],
      };
      g.people.push(it);
      map.set(key, g);
    }
    return [...map.values()]
      .map(g => ({ ...g, people: g.people.sort((a, b) => this.nameOf(a).localeCompare(this.nameOf(b))) }))
      .sort((a, b) => a.time.localeCompare(b.time));
  });

  readonly totalPeople = computed(() => this.classes().reduce((n, c) => n + c.people.length, 0));
  readonly doneCount = computed(() =>
    this.classes().reduce((n, c) => n + c.people.filter(p => this.stateOf(p.client.userId).kind === 'doneToday').length, 0));

  // detalle abierto
  readonly openStudent = computed(() => {
    const id = this.openUserId();
    return id != null ? this.students()[id] ?? null : null;
  });
  readonly openItem = computed(() => this.items().find(i => i.client.userId === this.openUserId()) ?? null);
  readonly openDays = computed(() =>
    [...(this.openStudent()?.detail?.activeTemplate?.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex));
  readonly openDay = computed(() => this.openDays().find(d => d.workoutDayId === this.openDayId()) ?? null);
  readonly openDayDoneToday = computed(() => {
    const s = this.openStudent(), d = this.openDay();
    return !!s && !!d && s.logs.some(l => l.workoutDayId === d.workoutDayId && l.completedAt === this.today && l.completed);
  });

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.api.agenda({ from: this.today, to: this.today }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        this.items.set(list);
        this.isLoading.set(false);
        this.loadStudents(list);
      },
      error: err => { this.isLoading.set(false); this.error.set(apiErrorText(err, 'No se pudo cargar el día.')); },
    });
  }

  private loadStudents(list: AgendaItem[]): void {
    const ids = [...new Set(list.filter(i => i.status !== 'CANCELLED').map(i => i.client.userId))];
    const init: Record<number, StudentToday> = {};
    ids.forEach(id => init[id] = { loading: true, detail: null, logs: [], error: false });
    this.students.set(init);
    for (const id of ids) this.loadStudent(id);
  }

  private loadStudent(id: number): void {
    forkJoin({
      detail: this.logsApi.studentDetail(id).pipe(catchError(() => of(null))),
      logs: this.logsApi.history(id).pipe(catchError(() => of([] as TrainerWorkoutLog[]))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ detail, logs }) => {
      this.students.update(all => ({ ...all, [id]: { loading: false, detail, logs, error: !detail } }));
    });
  }

  nameOf(i: AgendaItem): string {
    const d = this.students()[i.client.userId]?.detail;
    return i.client?.name?.trim() || d?.fullName?.trim() || (d?.dni ? `DNI ${d.dni}` : 'Sin nombre');
  }

  initials(i: AgendaItem): string {
    const parts = this.nameOf(i).replace('DNI ', '').split(' ').filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  /** Qué día del plan le toca hoy (mismo criterio que el "Hoy" del alumno) */
  stateOf(userId: number): TodayState {
    const s = this.students()[userId];
    if (!s || s.loading) return { kind: 'loading', day: null, label: '…' };
    if (s.error) return { kind: 'error', day: null, label: 'Sin datos' };
    return todayPlan(s.detail?.activeTemplate?.days ?? [], s.logs, this.today);
  }

  open(i: AgendaItem): void {
    const st = this.stateOf(i.client.userId);
    this.openUserId.set(i.client.userId);
    this.openDayId.set(st.day?.workoutDayId ?? this.openDays()[0]?.workoutDayId ?? null);
  }

  close(): void { this.openUserId.set(null); }

  markDone(): void {
    const id = this.openUserId(), day = this.openDay();
    if (id == null || !day) return;
    this.isMarking.set(true);
    this.logsApi.markDone(id, day.workoutDayId, this.today).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: log => {
        this.isMarking.set(false);
        this.students.update(all => ({ ...all, [id]: { ...all[id], logs: [log, ...all[id].logs] } }));
        this.toast.success(`${day.name} marcado como hecho.`);
      },
      error: err => { this.isMarking.set(false); this.toast.error(apiErrorText(err)); },
    });
  }
}

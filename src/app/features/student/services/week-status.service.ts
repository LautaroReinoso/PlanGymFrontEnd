// ─────────────────────────────────────────────
//  GymPlan — WeekStatusService (Student)
//  Fuente única del estado de la semana. El backend lo calcula
//  a partir de los WorkoutLog; acá solo se guarda la última
//  respuesta en un signal que leen Semana, Día y "Hoy".
//  Marcar/desmarcar devuelven la semana recalculada → se pisa
//  el signal, sin recargar ni mantener estado local en las páginas.
// ─────────────────────────────────────────────

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';

import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { WeekDayStatus, WeekStatus } from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class WeekStatusService {

  private readonly http = inject(HttpClient);
  private readonly api  = inject(ENVIRONMENT).apiUrl;

  // ── Estado ────────────────────────────────────
  private readonly _week = signal<WeekStatus | null>(null);
  readonly week      = this._week.asReadonly();
  readonly isLoading = signal(false);
  /** workoutDayId que se está marcando/desmarcando (para el spinner del botón) */
  readonly pendingDayId = signal<number | null>(null);

  // ── Derivados ─────────────────────────────────
  readonly days = computed<WeekDayStatus[]>(() =>
    [...(this._week()?.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex));

  readonly percent = computed(() => {
    const w = this._week();
    return w && w.totalDays ? Math.round((w.doneCount / w.totalDays) * 100) : 0;
  });

  /** Primer día del plan (en orden) que falta esta semana; null si hizo todos */
  readonly nextDay = computed<WeekDayStatus | null>(() =>
    this._week()?.currentWeek ? this.days().find(d => !d.done) ?? null : null);

  /** ¿Este día ya está hecho HOY? (para el botón de la página del día) */
  doneToday(workoutDayId: number): boolean {
    const w = this._week();
    if (!w?.currentWeek) return false;
    const d = w.days.find(x => x.workoutDayId === workoutDayId);
    return !!d && d.completedAt === w.today;
  }

  // ── Acciones ──────────────────────────────────

  /** Carga la semana que contiene `date` (YYYY-MM-DD). Sin fecha = la actual. */
  load(date?: string): Observable<WeekStatus> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    this.isLoading.set(true);
    return this.http
      .get<WeekStatus>(`${this.api}/student-workouts/my-workout/week`, { params })
      .pipe(
        tap(w => this._week.set(w)),
        finalize(() => this.isLoading.set(false)),
      );
  }

  /** Marca el día como hecho hoy (o en `date`). Devuelve y guarda la semana actualizada. */
  markDone(workoutDayId: number, date?: string): Observable<WeekStatus> {
    return this.mutate('POST', workoutDayId, date);
  }

  /** Desmarca (se equivocó). Sin fecha = hoy. */
  unmark(workoutDayId: number, date?: string): Observable<WeekStatus> {
    return this.mutate('DELETE', workoutDayId, date);
  }

  /** Para tests / logout */
  clear(): void {
    this._week.set(null);
  }

  private mutate(method: 'POST' | 'DELETE', workoutDayId: number, date?: string): Observable<WeekStatus> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    const url = `${this.api}/workout-logs/my/${workoutDayId}`;
    this.pendingDayId.set(workoutDayId);
    return this.http.request<WeekStatus>(method, url, { params, body: method === 'POST' ? {} : undefined }).pipe(
      tap(w => this._week.set(w)),
      finalize(() => this.pendingDayId.set(null)),
    );
  }
}

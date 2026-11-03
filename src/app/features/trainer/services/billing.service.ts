// ─────────────────────────────────────────────
//  PlanGym — BillingService
//  Suscripción del entrenador (Mercado Pago preapproval).
//  Mantiene la última suscripción en una signal compartida
//  entre el banner y las páginas de suscripción.
// ─────────────────────────────────────────────

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import {
  ApiErrorBody,
  BillingPlan,
  CreateSubscriptionRequest,
  Subscription,
} from '../models/billing.models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);
  private readonly baseUrl = `${this.env.apiUrl}/billing`;

  /** false durante el período de prueba: la UI de suscripciones queda oculta. */
  readonly enabled = this.env.billingEnabled;

  // ── Estado compartido ─────────────────────────
  /** undefined = todavía no se consultó · null = nunca se suscribió */
  private readonly _mySubscription = signal<Subscription | null | undefined>(undefined);
  readonly mySubscription = this._mySubscription.asReadonly();

  readonly isLoaded = computed(() => this._mySubscription() !== undefined);
  readonly isActive = computed(() => this._mySubscription()?.status === 'AUTHORIZED');

  // ── Endpoints ─────────────────────────────────

  /** Público: no requiere token. */
  getPlans(): Observable<BillingPlan[]> {
    return this.http.get<BillingPlan[]>(`${this.baseUrl}/plans`);
  }

  createSubscription(body: CreateSubscriptionRequest): Observable<Subscription> {
    return this.http
      .post<Subscription>(`${this.baseUrl}/subscriptions`, body)
      .pipe(tap(sub => this._mySubscription.set(sub)));
  }

  /** 200 → última suscripción · 204 → null (nunca se suscribió). */
  getMySubscription(): Observable<Subscription | null> {
    return this.http
      .get<Subscription>(`${this.baseUrl}/subscriptions/me`, { observe: 'response' })
      .pipe(
        map(res => (res.status === 204 ? null : res.body ?? null)),
        tap(sub => this._mySubscription.set(sub)),
      );
  }

  cancelMySubscription(): Observable<Subscription> {
    return this.http
      .post<Subscription>(`${this.baseUrl}/subscriptions/me/cancel`, {})
      .pipe(tap(sub => this._mySubscription.set(sub)));
  }
}

/** Extrae el `message` de un error 400 del backend, o devuelve el fallback. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && err.status === 400) {
    const body = err.error as ApiErrorBody | null;
    if (body?.message) return body.message;
  }
  return fallback;
}

/** El backend avisa el límite de alumnos con este texto. */
export function isStudentLimitError(message: string | null): boolean {
  return !!message && /plan/i.test(message);
}

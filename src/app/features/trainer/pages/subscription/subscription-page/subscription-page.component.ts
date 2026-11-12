// ─────────────────────────────────────────────
//  PlanGym — SubscriptionPageComponent
//  /trainer/suscripcion  (y /suscripcion → redirect)
//  Estado de la suscripción + acciones.
//  También es la página de vuelta de Mercado Pago:
//  si llega con ?preapproval_id y el webhook todavía
//  no actualizó, consulta cada 3 s hasta 5 veces.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concatMap, takeWhile, timer } from 'rxjs';

import { BillingService, apiErrorMessage } from '../../../services/billing.service';
import { SubscriptionStatus } from '../../../models/billing.models';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge-component/badge.component';
import { PageLoaderComponent } from '../../../../../shared/components/page-loader/page-loader.component';
import { CancelSubscriptionModalComponent } from '../../../components/subscription/cancel-subscription-modal/cancel-subscription-modal.component';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_RETRIES = 5;

const STATUS_UI: Record<SubscriptionStatus | 'NONE', { label: string; variant: BadgeVariant }> = {
  AUTHORIZED: { label: 'Activa',             variant: 'success' },
  PENDING:    { label: 'Pendiente de pago',  variant: 'warning' },
  PAUSED:     { label: 'Pausada',            variant: 'warning' },
  CANCELLED:  { label: 'Cancelada',          variant: 'danger'  },
  NONE:       { label: 'Sin suscripción',    variant: 'default' },
};

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    ButtonComponent,
    BadgeComponent,
    PageLoaderComponent,
    CancelSubscriptionModalComponent,
  ],
  templateUrl: './subscription-page.component.html',
  styleUrl: './subscription-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPageComponent implements OnInit {
  private readonly billing    = inject(BillingService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ── Estado ────────────────────────────────────
  readonly subscription = this.billing.mySubscription;
  readonly isLoading    = signal(true);
  readonly isConfirming = signal(false);   // polling tras volver de MP
  readonly loadError    = signal<string | null>(null);
  readonly stillPending = signal(false);   // se agotaron los reintentos

  readonly showCancelModal = signal(false);
  readonly isCancelling    = signal(false);
  readonly cancelError     = signal<string | null>(null);

  // ── Derivados ─────────────────────────────────
  readonly status = computed<SubscriptionStatus | 'NONE'>(() => this.subscription()?.status ?? 'NONE');
  readonly statusUi = computed(() => STATUS_UI[this.status()]);

  ngOnInit(): void {
    const returningFromMp = this.route.snapshot.queryParamMap.has('preapproval_id');
    this.load(returningFromMp);
  }

  // ── Carga / polling ───────────────────────────
  load(returningFromMp = false): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.stillPending.set(false);

    let attempt = 0;

    // 1ª consulta inmediata; si volvemos de MP y sigue PENDING,
    // reintenta cada 3 s hasta POLL_MAX_RETRIES veces.
    timer(0, POLL_INTERVAL_MS)
      .pipe(
        concatMap(() => this.billing.getMySubscription()),
        takeWhile(sub => {
          const keepPolling =
            returningFromMp && sub?.status === 'PENDING' && attempt < POLL_MAX_RETRIES;
          attempt++;
          this.isConfirming.set(keepPolling);
          this.isLoading.set(false);
          return keepPolling;
        }, true),
        takeUntilDestroyed(this.destroyRef),
      )
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        complete: () => {
          this.isConfirming.set(false);
          if (returningFromMp) {
            this.stillPending.set(this.subscription()?.status === 'PENDING');
            this.clearQueryParams();
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.isConfirming.set(false);
          this.loadError.set('No pudimos consultar tu suscripción. Probá de nuevo en un rato.');
        },
      });
  }

  private clearQueryParams(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  // ── Acciones ──────────────────────────────────
  continuePayment(): void {
    const url = this.subscription()?.initPoint;
    if (url) window.location.href = url;
  }

  openCancel(): void {
    this.cancelError.set(null);
    this.showCancelModal.set(true);
  }

  confirmCancel(): void {
    this.isCancelling.set(true);
    this.cancelError.set(null);

    this.billing.cancelMySubscription().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.showCancelModal.set(false);
      },
      error: err => {
        this.isCancelling.set(false);
        this.cancelError.set(apiErrorMessage(err, 'No se pudo cancelar la suscripción.'));
      },
    });
  }

  studentsLabel(max: number | null): string {
    return max == null ? 'Ilimitado' : `Hasta ${max} alumnos`;
  }
}

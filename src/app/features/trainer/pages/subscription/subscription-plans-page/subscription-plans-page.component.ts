// ─────────────────────────────────────────────
//  PlanGym — SubscriptionPlansPageComponent
//  /trainer/suscripcion/planes
//  Lista de planes (desde el backend) y alta de suscripción.
// ─────────────────────────────────────────────

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, of, switchMap } from 'rxjs';

import { BillingService, apiErrorMessage } from '../../../services/billing.service';
import { BillingPlan, Subscription } from '../../../models/billing.models';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { BadgeComponent } from '../../../../../shared/components/badge-component/badge.component';
import { PageLoaderComponent } from '../../../../../shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-subscription-plans-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ButtonComponent, BadgeComponent, PageLoaderComponent],
  templateUrl: './subscription-plans-page.component.html',
  styleUrl: './subscription-plans-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPlansPageComponent implements OnInit {
  private readonly billing = inject(BillingService);

  // ── Estado ────────────────────────────────────
  readonly plans        = signal<BillingPlan[]>([]);
  readonly isLoading    = signal(true);
  readonly loadError    = signal<string | null>(null);
  readonly subscribing  = signal<string | null>(null); // planCode en curso
  readonly actionError  = signal<string | null>(null);

  // ── Derivados ─────────────────────────────────
  readonly isActive = this.billing.isActive;
  readonly currentPlanCode = computed(() =>
    this.isActive() ? this.billing.mySubscription()?.plan.code ?? null : null,
  );
  /** Plan de una suscripción que quedó en PENDING (pago sin terminar). */
  readonly pendingPlanCode = computed(() => {
    const sub = this.billing.mySubscription();
    return sub?.status === 'PENDING' ? sub.plan.code : null;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      plans: this.billing.getPlans(),
      sub: this.billing.getMySubscription(),
    }).subscribe({
      next: ({ plans }) => {
        this.plans.set(plans);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('No pudimos cargar los planes. Probá de nuevo en un rato.');
        this.isLoading.set(false);
      },
    });
  }

  subscribe(plan: BillingPlan): void {
    if (this.isActive() || this.subscribing()) return;

    this.subscribing.set(plan.code);
    this.actionError.set(null);

    // Si hay un pago pendiente, se cancela antes de generar uno nuevo
    // (así se puede reintentar o cambiar de plan sin quedar trabado).
    const cancelPending$: Observable<Subscription | null> = this.pendingPlanCode()
      ? this.billing.cancelMySubscription()
      : of(null);

    cancelPending$
      .pipe(switchMap(() => this.billing.createSubscription({ planCode: plan.code })))
      .subscribe({
      next: sub => {
        if (sub.initPoint) {
          // Checkout de Mercado Pago (sale de la app)
          window.location.href = sub.initPoint;
        } else {
          this.actionError.set('No recibimos el link de pago. Probá de nuevo.');
          this.subscribing.set(null);
        }
      },
      error: err => {
        this.actionError.set(apiErrorMessage(err, 'No se pudo iniciar la suscripción.'));
        this.subscribing.set(null);
      },
    });
  }

  studentsLabel(plan: BillingPlan): string {
    return plan.maxStudents == null ? 'Alumnos ilimitados' : `Hasta ${plan.maxStudents} alumnos`;
  }

  periodLabel(plan: BillingPlan): string {
    return plan.frequencyMonths === 1 ? '/mes' : `/${plan.frequencyMonths} meses`;
  }
}

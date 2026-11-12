// ─────────────────────────────────────────────
//  PlanGym — SubscriptionBannerComponent
//  Aviso discreto cuando el entrenador no tiene
//  suscripción activa (sus alumnos no pueden entrar).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../../services/billing.service';

@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './subscription-banner.component.html',
  styleUrl: './subscription-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionBannerComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly billing = inject(BillingService);

  /** Solo se muestra cuando ya sabemos el estado y no es AUTHORIZED. */
  readonly visible = computed(() => this.billing.enabled && this.billing.isLoaded() && !this.billing.isActive());
  readonly isPending = computed(() => this.billing.mySubscription()?.status === 'PENDING');

  ngOnInit(): void {
    if (!this.billing.enabled) return; // período de prueba: ni consultamos
    // Si falla, no mostramos nada: es un aviso, no debe romper la página.
    this.billing.getMySubscription().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
  }
}

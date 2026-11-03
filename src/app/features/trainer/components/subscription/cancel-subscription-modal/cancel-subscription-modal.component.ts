// ─────────────────────────────────────────────
//  PlanGym — CancelSubscriptionModalComponent
//  Confirmación de baja (sobre gp-modal).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';

@Component({
  selector: 'app-cancel-subscription-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './cancel-subscription-modal.component.html',
  styleUrl: './cancel-subscription-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelSubscriptionModalComponent {
  readonly isOpen       = input<boolean>(false);
  readonly isCancelling = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly closed    = output<void>();
  readonly confirmed = output<void>();
}

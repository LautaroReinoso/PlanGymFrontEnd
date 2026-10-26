// ─────────────────────────────────────────────
//  GymPlan — ForgotPasswordComponent (/recuperar-contrasena)
//  El trainer ingresa su mail y recibe un link. La respuesta es
//  siempre la misma, exista o no la cuenta.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PasswordResetService } from '../../../core/auth/services/password-reset.service';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../shared/components/button-component/button-component.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputFieldComponent, ButtonComponent],
  templateUrl: './forgot-password.component.html',
  // Mismo look que el login
  styleUrls: ['../login/login.component.css', './forgot-password.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PasswordResetService);

  readonly form = this.fb.nonNullable.group({
    mail: ['', [Validators.required, Validators.email]],
  });

  readonly isLoading = signal(false);
  readonly sent = signal(false);
  readonly errorMessage = signal<string | null>(null);

  mailError(): string | null {
    const c = this.form.controls.mail;
    return c.touched && c.invalid ? 'Ingresá un mail válido' : null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.forgot(this.form.controls.mail.value.trim()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No pudimos procesar el pedido. Intentá de nuevo en unos minutos.');
      },
    });
  }
}

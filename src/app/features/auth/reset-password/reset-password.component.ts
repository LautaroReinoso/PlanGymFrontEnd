// ─────────────────────────────────────────────
//  GymPlan — ResetPasswordComponent (/reset-password?token=…)
//  Llega desde el link del mail. Elige contraseña nueva y vuelve al login.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { PasswordResetService } from '../../../core/auth/services/password-reset.service';
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../shared/components/button-component/button-component.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const a = group.get('password')?.value;
  const b = group.get('confirm')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputFieldComponent, ButtonComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PasswordResetService);

  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  readonly isLoading = signal(false);
  readonly done = signal(false);
  readonly errorMessage = signal<string | null>(null);

  passwordError(): string | null {
    const c = this.form.controls.password;
    return c.touched && c.invalid ? 'Mínimo 8 caracteres' : null;
  }

  confirmError(): string | null {
    const c = this.form.controls.confirm;
    if (!c.touched) return null;
    if (c.invalid) return 'Repetí la contraseña';
    return this.form.hasError('mismatch') ? 'Las contraseñas no coinciden' : null;
  }

  submit(): void {
    if (!this.token) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.reset(this.token, this.form.controls.password.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigate(['/login/entrenador']), 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 400
            ? 'El link no es válido o ya venció. Pedí uno nuevo.'
            : 'No pudimos cambiar la contraseña. Intentá de nuevo.',
        );
      },
    });
  }
}

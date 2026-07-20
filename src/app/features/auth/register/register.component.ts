// ─────────────────────────────────────────────
//  GymPlan — RegisterComponent
//  Angular 19 standalone. Mail + Password.
//  POST /auth/register → redirige a /login
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';
import { ButtonComponent } from '../../../shared/components/button-component/button-component.component';

// Validator: confirmar que ambas contraseñas coinciden
function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const password = ctrl.get('password')?.value;
  const confirm  = ctrl.get('confirmPassword')?.value;
  return password && confirm && password !== confirm
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputFieldComponent, ButtonComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {

  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http   = inject(HttpClient);
  private readonly env    = inject(ENVIRONMENT);

  // ── Form ─────────────────────────────────────
  readonly form = this.fb.nonNullable.group(
    {
      mail:            ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  // ── Estado UI ────────────────────────────────
  readonly isLoading     = signal(false);
  readonly errorMessage  = signal<string | null>(null);
  readonly submitted     = signal(false);
  readonly registerOk    = signal(false);   // muestra pantalla de éxito

  // ── Errores reactivos ─────────────────────────
  readonly mailError = computed(() => {
    if (!this.submitted()) return null;
    const ctrl = this.form.controls.mail;
    if (ctrl.hasError('required')) return 'El correo es requerido.';
    if (ctrl.hasError('email'))    return 'Ingresá un correo válido.';
    return null;
  });

  readonly passwordError = computed(() => {
    if (!this.submitted()) return null;
    const ctrl = this.form.controls.password;
    if (ctrl.hasError('required'))  return 'La contraseña es requerida.';
    if (ctrl.hasError('minlength')) return 'Mínimo 6 caracteres.';
    return null;
  });

  readonly confirmError = computed(() => {
    if (!this.submitted()) return null;
    const ctrl = this.form.controls.confirmPassword;
    if (ctrl.hasError('required'))          return 'Confirmá tu contraseña.';
    if (this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden.';
    return null;
  });

  // ── Submit ────────────────────────────────────
  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { mail, password } = this.form.getRawValue();

    this.http
      .post(`${this.env.apiUrl}/auth/register`, { mail, password })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.registerOk.set(true);
          // Redirigir al login tras 2 segundos
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 409) {
            this.errorMessage.set('Ya existe una cuenta con ese correo.');
          } else if (err.status === 0) {
            this.errorMessage.set('No se pudo conectar con el servidor.');
          } else {
            this.errorMessage.set('Error al registrarse. Intentá de nuevo.');
          }
        },
      });
  }
}
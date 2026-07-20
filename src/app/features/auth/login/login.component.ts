// ─────────────────────────────────────────────
//  GymPlan — LoginComponent
//  Angular 19 standalone. Sin librerías externas.
//  Estado con signals. Form con ReactiveFormsModule.
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
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth/services/auth.service';
import { ButtonComponent } from "../../../shared/components/button-component/button-component.component";
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputFieldComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {

  
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private router = inject(Router);
 
  // ── Form ─────────────────────────────────────
  readonly form = this.fb.nonNullable.group({
    mail:     ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
 
  // ── Estado UI ────────────────────────────────
  readonly isLoading    = signal(false);
  readonly errorMessage = signal<string | null>(null);
 
  // submitted dispara la validación visual en todos los campos
  readonly submitted = signal(false);
 
  // Los computed leen "submitted" como signal → se recalculan al hacer submit
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
    if (ctrl.hasError('required'))    return 'La contraseña es requerida.';
    if (ctrl.hasError('minlength'))   return 'Mínimo 6 caracteres.';
    return null;
  });
 
  // ── Acciones ─────────────────────────────────
 
  onSubmit(): void {
    this.submitted.set(true);
 
    if (this.form.invalid) return;
 
    this.isLoading.set(true);
    this.errorMessage.set(null);
 
    this.auth.login(this.form.getRawValue()).subscribe({
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },

    });
  }
}
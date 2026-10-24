// ─────────────────────────────────────────────
//  GymPlan — LoginComponent
//  Angular 19 standalone. Sin librerías externas.
//  Estado con signals. Form con ReactiveFormsModule.
//
//  Dos modos en la misma pantalla:
//   · Entrenador → correo + contraseña
//   · Alumno     → solo DNI
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';
import { LOGIN_MODE_KEY } from '../../../core/auth/services/storage.service';
import { LoginMode } from '../../../core/models/auth/auth.models';
import { ButtonComponent } from "../../../shared/components/button-component/button-component.component";
import { InputFieldComponent } from '../../../shared/components/input-field/input-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputFieldComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {

  private readonly fb        = inject(FormBuilder);
  private readonly auth      = inject(AuthService);
  private readonly route     = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ── Modo ─────────────────────────────────────
  // Prioridad: ruta (/login/alumno) → último modo usado → entrenador
  readonly mode = signal<LoginMode>(this.resolveInitialMode());
  readonly isStudentMode = computed(() => this.mode() === 'student');

  // true después del primer cambio de modo (para animar solo el cambio)
  readonly switched = signal(false);

  // ── Forms ────────────────────────────────────
  readonly trainerForm = this.fb.nonNullable.group({
    mail:     ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly studentForm = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
  });

  // ── Estado UI ────────────────────────────────
  readonly isLoading    = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // submitted dispara la validación visual en todos los campos
  readonly submitted = signal(false);

  // Los computed leen "submitted" como signal → se recalculan al hacer submit
  readonly mailError = computed(() => {
    if (!this.submitted()) return null;
    const ctrl = this.trainerForm.controls.mail;
    if (ctrl.hasError('required')) return 'El correo es requerido.';
    if (ctrl.hasError('email'))    return 'Ingresá un correo válido.';
    return null;
  });

  readonly passwordError = computed(() => {
    if (!this.submitted()) return null;
    const ctrl = this.trainerForm.controls.password;
    if (ctrl.hasError('required'))  return 'La contraseña es requerida.';
    if (ctrl.hasError('minlength')) return 'Mínimo 6 caracteres.';
    return null;
  });

  readonly dniError = computed(() => {
    if (!this.submitted()) return null;
    const ctrl = this.studentForm.controls.dni;
    if (ctrl.hasError('required')) return 'Ingresá tu DNI.';
    if (ctrl.hasError('pattern'))  return 'El DNI tiene 7 u 8 números.';
    return null;
  });

  constructor() {
    // El DNI solo admite números (pega "35.456.123" y queda "35456123")
    const dni = this.studentForm.controls.dni;
    dni.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const clean = value.replace(/\D/g, '').slice(0, 8);
        if (clean !== value) dni.setValue(clean, { emitEvent: false });
      });
  }

  // ── Acciones ─────────────────────────────────

  setMode(mode: LoginMode): void {
    if (mode === this.mode() || this.isLoading()) return;
    this.mode.set(mode);
    this.switched.set(true);
    this.submitted.set(false);
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    this.submitted.set(true);

    const form = this.isStudentMode() ? this.studentForm : this.trainerForm;
    if (form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request$ = this.isStudentMode()
      ? this.auth.loginStudent(this.studentForm.getRawValue().dni)
      : this.auth.login(this.trainerForm.getRawValue());

    request$.subscribe({
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  // ── Privados ─────────────────────────────────

  private resolveInitialMode(): LoginMode {
    const fromRoute = this.route.snapshot.data['mode'] as LoginMode | undefined;
    if (fromRoute === 'student' || fromRoute === 'trainer') return fromRoute;

    try {
      const stored = localStorage.getItem(LOGIN_MODE_KEY);
      if (stored === 'student' || stored === 'trainer') return stored;
    } catch {
      /* storage no disponible: se ignora */
    }
    return 'trainer';
  }
}

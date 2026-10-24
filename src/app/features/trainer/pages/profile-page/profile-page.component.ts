import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { TrainerProfile, UpdateTrainerProfileRequest } from '../../models/trainer.models';
import { TrainerProfileService } from '../../services/trainer-profile.service';

// Validador simple: newPassword !== confirmPassword
function passwordsMatch(group: import('@angular/forms').AbstractControl) {
  const pass = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-trainer-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class TrainerProfilePageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(TrainerProfileService);

  // --- Datos personales ---
  readonly profile = signal<TrainerProfile | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly dirty = signal(false);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: [''],
    direccion: ['', Validators.maxLength(200)],
    ciudadProvincia: ['', Validators.maxLength(100)],
    cel: ['', Validators.maxLength(30)],
  });

  // --- Contraseña ---
  readonly changingPassword = signal(false);
  readonly passwordChanged = signal(false);
  readonly passwordError = signal<string | null>(null);

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.dirty.set(true);
      this.saved.set(false);
    });
    this.passwordForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.passwordChanged.set(false);
      this.passwordError.set(null);
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.getMyProfile().subscribe({
      next: (p) => {
        this.applyProfile(p);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.service.updateMyProfile(this.toRequest()).subscribe({
      next: (p) => {
        this.applyProfile(p);
        this.saving.set(false);
        this.saved.set(true);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.changingPassword.set(true);
    this.passwordError.set(null);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.service.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordChanged.set(true);
        this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.changingPassword.set(false);
        // El backend responde 400 con un código en `message` (un 401 cerraría la sesión)
        switch (err.error?.message) {
          case 'CURRENT_PASSWORD_INCORRECT':
            this.passwordError.set('La contraseña actual no es correcta.');
            break;
          case 'NEW_PASSWORD_SAME_AS_CURRENT':
            this.passwordError.set('La nueva contraseña debe ser distinta a la actual.');
            break;
          case 'NEW_PASSWORD_TOO_SHORT':
            this.passwordError.set('La nueva contraseña debe tener al menos 8 caracteres.');
            break;
          default:
            this.passwordError.set('No se pudo cambiar la contraseña. Intentá de nuevo.');
        }
      },
    });
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  showPasswordError(name: keyof typeof this.passwordForm.controls): boolean {
    const c = this.passwordForm.controls[name];
    return c.touched && c.invalid;
  }

  get passwordsMismatch(): boolean {
    return (
      this.passwordForm.hasError('passwordMismatch') &&
      this.passwordForm.controls.confirmPassword.touched
    );
  }

  private applyProfile(p: TrainerProfile): void {
    this.profile.set(p);
    this.form.reset(
      {
        nombre: p.nombre ?? '',
        apellido: p.apellido ?? '',
        fechaNacimiento: p.fechaNacimiento ?? '',
        direccion: p.direccion ?? '',
        ciudadProvincia: p.ciudadProvincia ?? '',
        cel: p.cel ?? '',
      },
      { emitEvent: false },
    );
    this.dirty.set(false);
  }

  private toRequest(): UpdateTrainerProfileRequest {
    const v = this.form.getRawValue();
    const opt = (s: string) => (s.trim() === '' ? null : s.trim());
    return {
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      fechaNacimiento: opt(v.fechaNacimiento) as string,
      direccion: opt(v.direccion) as string,
      ciudadProvincia: opt(v.ciudadProvincia) as string,
      cel: opt(v.cel) as string,
    };
  }
}
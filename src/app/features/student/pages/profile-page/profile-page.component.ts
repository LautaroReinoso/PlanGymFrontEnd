import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { StudentProfile, UpdateStudentProfileRequest } from '../../models/student.models';
import { StudentProfileService } from '../../services/student-profile.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageLoaderComponent, ReactiveFormsModule, RouterLink, InputFieldComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(StudentProfileService);
  private readonly auth = inject(AuthService);

  readonly profile = signal<StudentProfile | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly dirty = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly mailTaken = signal(false);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: [''],
    direccion: ['', Validators.maxLength(200)],
    ciudadProvincia: ['', Validators.maxLength(100)],
    cel: ['', Validators.maxLength(30)],
    mail: ['', [Validators.email, Validators.maxLength(150)]],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.dirty.set(true);
      this.saved.set(false);
      this.mailTaken.set(false);
      this.saveError.set(null);
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
    this.saveError.set(null);

    this.service.updateMyProfile(this.toRequest()).subscribe({
      next: (p) => {
        this.applyProfile(p);
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        if (err.status === 409) {
          this.mailTaken.set(true);
        } else {
          this.saveError.set('No se pudo guardar. Intentá de nuevo.');
        }
      },
    });
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  private applyProfile(p: StudentProfile): void {
    this.profile.set(p);
    this.form.reset(
      {
        nombre: p.nombre ?? '',
        apellido: p.apellido ?? '',
        fechaNacimiento: p.fechaNacimiento ?? '',
        direccion: p.direccion ?? '',
        ciudadProvincia: p.ciudadProvincia ?? '',
        cel: p.cel ?? '',
        mail: p.mail ?? '',
      },
      { emitEvent: false },
    );
    this.dirty.set(false);
  }

  private toRequest(): UpdateStudentProfileRequest {
    const v = this.form.getRawValue();
    const opt = (s: string) => (s.trim() === '' ? null : s.trim());
    return {
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      fechaNacimiento: opt(v.fechaNacimiento),
      direccion: opt(v.direccion),
      ciudadProvincia: opt(v.ciudadProvincia),
      cel: opt(v.cel),
      mail: opt(v.mail),
    };
  }

  logout(): void {
    if (!confirm('¿Cerrar sesión?')) return;
    this.auth.logout();
  }
}

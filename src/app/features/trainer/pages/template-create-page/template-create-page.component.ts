// ─────────────────────────────────────────────
//  GymPlan — TemplateCreatePageComponent
//  Página dedicada para crear una plantilla.
//  POST /workout-templates → navega al builder
//  de la plantilla recién creada.
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TemplateService } from '../../services/template.service';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';

@Component({
  selector: 'app-template-create-page',
  standalone: true,
  imports: [CommonModule, FormsModule, InputFieldComponent, ButtonComponent],
  templateUrl: './template-create-page.component.html',
  styleUrl: './template-create-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCreatePageComponent {

  private readonly templateSvc = inject(TemplateService);
  private readonly router      = inject(Router);

  // ── Estado del form ───────────────────────────
  readonly name        = signal('');
  readonly description = signal('');

  readonly isSaving = signal(false);
  readonly error    = signal<string | null>(null);
  readonly submitted = signal(false);

  // ── Computed ──────────────────────────────────
  readonly canSave = computed(() =>
    this.name().trim().length > 0
  );

  readonly nameError = computed(() => {
    if (!this.submitted()) return null;
    return this.name().trim().length === 0
      ? 'El nombre es requerido.'
      : null;
  });

  // ── Acciones ──────────────────────────────────
  onSave(): void {
    this.submitted.set(true);
    if (!this.canSave()) return;

    this.isSaving.set(true);
    this.error.set(null);

    this.templateSvc.create({
      name: this.name().trim(),
      description: this.description().trim() || undefined,
    }).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        // Ir directo al builder para empezar a agregar días
        this.router.navigate(['/trainer/templates', created.id]);
      },
      error: () => {
        this.isSaving.set(false);
        this.error.set('No se pudo crear la plantilla. Intentá de nuevo.');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/trainer/templates']);
  }
}
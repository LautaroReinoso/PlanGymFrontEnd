// ─────────────────────────────────────────────
//  GymPlan — TemplateEditModalComponent
//  Edita nombre y descripción de un template
//  existente. PUT /workout-templates/:id
//  Componente "tonto": recibe datos, emite resultado.
//  La página padre maneja el HTTP call.
// ─────────────────────────────────────────────

import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UpdateTemplateRequest } from '../../../models/trainer.models';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-template-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent],
  templateUrl: './template-edit-modal.component.html',
  styleUrl: './template-edit-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditModalComponent {

  // ── Inputs ────────────────────────────────────
  readonly isOpen           = input<boolean>(false);
  readonly initialName      = input<string>('');
  readonly initialDescription = input<string>('');
  readonly isSaving         = input<boolean>(false);
  readonly errorMessage     = input<string | null>(null);

  // ── Outputs ───────────────────────────────────
  readonly closed = output<void>();
  readonly saved  = output<UpdateTemplateRequest>();

  // ── Estado del form ───────────────────────────
  readonly name        = signal('');
  readonly description = signal('');

  readonly canSave = computed(() =>
    this.name().trim().length > 0
  );

  constructor() {
    // Sincroniza los valores iniciales cada vez que se abre el modal
    effect(() => {
      if (this.isOpen()) {
        this.name.set(this.initialName());
        this.description.set(this.initialDescription());
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  onSave(): void {
    if (!this.canSave()) return;
    this.saved.emit({
      name: this.name().trim(),
      description: this.description().trim() || undefined,
    });
  }
}
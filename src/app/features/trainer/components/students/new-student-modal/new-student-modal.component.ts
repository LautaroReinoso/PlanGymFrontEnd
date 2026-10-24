import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { InputFieldComponent } from '../../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { CreateStudentRequest } from '../../../models/student.models';

@Component({
  selector: 'app-new-student-modal',
  imports: [CommonModule, FormsModule, ModalComponent, InputFieldComponent, ButtonComponent],
  templateUrl: './new-student-modal.component.html',
  styleUrl: './new-student-modal.component.css'
})
export class NewStudentModalComponent {

  // ── Inputs ────────────────────────────────────
  readonly isOpen       = input<boolean>(false);  // FIX: default false
  readonly isSaving     = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  // ── Outputs ───────────────────────────────────
  readonly closed = output<void>();
  readonly saved  = output<CreateStudentRequest>();

  // ── Estado del form ───────────────────────────
  readonly dni       = signal('');
  readonly submitted = signal(false);

  // FIX: reset al abrir el modal
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.dni.set('');
        this.submitted.set(false);
      }
    });
  }

  // ── Validación ────────────────────────────────

  // Base computada — evita repetir la lógica
  private readonly dniValue = computed(() => this.dni().trim());

  readonly dniError = computed(() => {
    if (!this.submitted()) return null;
    if (this.dniValue().length === 0)    return 'El DNI es requerido.';
    if (!/^\d+$/.test(this.dniValue()))  return 'El DNI debe contener solo números.';
    if (this.dniValue().length < 7 ||
        this.dniValue().length > 8)      return 'El DNI debe tener 8 dígitos.';
    return null;
  });

  readonly canSave = computed(() =>
    this.dniValue().length >= 7 &&
    this.dniValue().length <= 8 &&
    /^\d+$/.test(this.dniValue())
  );

  // ── Acciones ──────────────────────────────────
  onSave(): void {
    this.submitted.set(true);
    if (!this.canSave()) return;
    this.saved.emit({ dni: this.dniValue() });
  }

  onClose(): void {
    this.closed.emit();
  }
}
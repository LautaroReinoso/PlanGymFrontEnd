// ─────────────────────────────────────────────
//  GymPlan — EditDayModalComponent
//  Modal para editar nombre y descripción
//  de un día del template.
//
//  Uso:
//  <app-edit-day-modal
//    [isOpen]="showEditDayModal()"
//    [day]="selectedDay()"
//    [isSaving]="isSavingDay()"
//    [errorMessage]="editDayError()"
//    (closed)="showEditDayModal.set(false)"
//    (saved)="onDaySaved($event)"
//  />
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

import { WorkoutTemplateDay } from '../../../models/trainer.models';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { InputFieldComponent } from '../../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';

export interface UpdateDayRequest {
  name: string;
  description: string;
  orderIndex: number;
}

// Nombres de días de la semana para el selector opcional
export const DAY_OF_WEEK: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

@Component({
  selector: 'app-edit-day-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, InputFieldComponent, ButtonComponent],
  templateUrl: './edit-day-modal.component.html',
  styleUrl: './edit-day-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDayModalComponent {

  // ── Inputs ────────────────────────────────────
  readonly isOpen       = input<boolean>(false);
  readonly day          = input<WorkoutTemplateDay | null>(null);
  readonly isSaving     = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  // ── Outputs ───────────────────────────────────
  readonly closed = output<void>();
  readonly saved  = output<UpdateDayRequest>();

  // ── Estado del form ───────────────────────────
  readonly name        = signal('');
  readonly description = signal('');
  readonly orderIndex  = signal(0);
  readonly submitted   = signal(false);

  // Validación
  readonly nameError = computed(() => {
    if (!this.submitted()) return null;
    return this.name().trim().length === 0
      ? 'El nombre es requerido.'
      : null;
  });

  readonly canSave = computed(() =>
    this.name().trim().length > 0
  );

  // Info de solo lectura del día
  readonly dayOfWeekLabel = computed(() => {
    const d = this.day();
    if (!d?.dayNumber) return null;
    return DAY_OF_WEEK[d.dayNumber] ?? null;
  });

  // Sincronizar valores cada vez que se abre o cambia el día
  constructor() {
    effect(() => {
      const d = this.day();
      if (this.isOpen() && d) {
        this.name.set(d.name ?? '');
        this.description.set(d.description ?? '');
        this.orderIndex.set(d.orderIndex);
        this.submitted.set(false);
      }
    });
  }

  // ── Acciones ──────────────────────────────────

  onSave(): void {
    this.submitted.set(true);
    if (!this.canSave()) return;

    this.saved.emit({
      name:        this.name().trim(),
      description: this.description().trim(),
      orderIndex:  this.orderIndex(),
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
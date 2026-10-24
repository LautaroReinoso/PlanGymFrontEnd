import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExerciseDetail } from '../../../models/trainer.models';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ExerciseFormComponent, ExerciseFormValue } from '../exercise-form/exercise-form.component';

@Component({
  selector: 'app-exercise-form-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ExerciseFormComponent],
  templateUrl: './exercise-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseFormModalComponent {
  readonly isOpen          = input.required<boolean>();
  readonly editingExercise = input<ExerciseDetail | null>(null);
  readonly submitting      = input<boolean>(false);
  /** true = "Crear variante": precarga editingExercise pero mantiene modo creación */
  readonly forceCreate     = input<boolean>(false);

  readonly closed = output<void>();
  readonly save   = output<ExerciseFormValue>();

  get title(): string {
    if (this.forceCreate()) return 'Crear variante';
    return this.editingExercise() ? 'Editar ejercicio' : 'Nuevo ejercicio';
  }

  onSave(value: ExerciseFormValue): void {
    this.save.emit(value);
  }
}
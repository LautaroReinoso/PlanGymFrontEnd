// ─────────────────────────────────────────────
//  GymPlan — TemplateDayComponent
//  Renderiza un día del template con sus
//  ejercicios. Reutilizable dentro del builder.
// ─────────────────────────────────────────────

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkoutTemplateDay } from '../../../models/trainer.models';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { IconButtonComponent } from '../../../../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-template-day',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconButtonComponent],
  templateUrl: './template-day.component.html',
  styleUrl: './template-day.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDayComponent {

  readonly day = input.required<WorkoutTemplateDay>();

  readonly addExercise    = output<number>();   // emite dayId
  readonly editDay        = output<number>();   // emite dayId
  readonly removeExercise = output<number>();   // emite exerciseId (DayExercise.id)
  readonly removeDay      = output<number>();   // emite dayId


  onAddExercise(): void {
    this.addExercise.emit(this.day().workoutDayId);
  }
  onEditDay(): void {
    this.editDay.emit(this.day().workoutDayId);
  }

  onRemoveExercise(exerciseId: number): void {
    this.removeExercise.emit(exerciseId);
  }

  onRemoveDay(): void {
    this.removeDay.emit(this.day().workoutDayId);
  }

}
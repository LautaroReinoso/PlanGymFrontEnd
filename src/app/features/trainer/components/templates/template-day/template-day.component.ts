import { DayExercise } from '../../../models/trainer.models';
// ─────────────────────────────────────────────
//  GymPlan — TemplateDayComponent
//  Renderiza un día del template con sus
//  ejercicios. Reutilizable dentro del builder.
// ─────────────────────────────────────────────

import { dayExerciseSummary } from '../../../models/exercise-meta.util';
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import { WorkoutTemplateDay } from '../../../models/trainer.models';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { IconButtonComponent } from '../../../../../shared/components/icon-button/icon-button.component';
import { ExerciseItemComponent } from '../../../../../shared/components/exercise-item/exercise-item.component';

@Component({
  selector: 'app-template-day',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, ButtonComponent, IconButtonComponent, ExerciseItemComponent],
  templateUrl: './template-day.component.html',
  styleUrl: './template-day.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDayComponent {

  /** "3 series · 8–10 reps · 90 s" */
  summary(de: DayExercise): string {
    return dayExerciseSummary(de);
  }

  readonly day = input.required<WorkoutTemplateDay>();

  readonly addExercise    = output<number>();   // emite dayId
  readonly editDay        = output<number>();   // emite dayId
  readonly removeExercise = output<number>();   // emite exerciseId (DayExercise.id)
  readonly removeDay      = output<number>();   // emite dayId
  readonly reorderExercises = output<number[]>(); // emite DayExercise.id en el orden nuevo

  readonly readonly = input<boolean>(false);


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

  /** Drag & drop (Angular CDK): calcula el nuevo orden de ids y lo emite al padre. */
  onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;

    const ids = this.day().exercises.map(e => e.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.reorderExercises.emit(ids);
  }

}
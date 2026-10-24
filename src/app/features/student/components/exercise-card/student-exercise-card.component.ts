// ─────────────────────────────────────────────
//  GymPlan — StudentExerciseCardComponent
//  Específico de Student: `app-exercise-item` (Trainer)
//  no soporta expand/detalle ni estado de progreso,
//  así que se creó este en vez de forzarlo.
//
//  ⚠️ El check de "completado" es SOLO local/efímero:
//  el backend no registra progreso por ejercicio,
//  solo por día completo (WorkoutLog). Se resetea al
//  recargar la página.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DayExercise } from '../../../trainer/models/trainer.models';
import { muscleGroupLabel } from '../../../trainer/models/muscle-group.util';
import { repsRangeLabel, restLabel } from '../../../trainer/models/exercise-meta.util';
import { MuscleIconComponent } from '../../../../shared/components/muscle-icon/muscle-icon.component';

@Component({
  selector: 'app-student-exercise-card',
  standalone: true,
  imports: [CommonModule, MuscleIconComponent],
  templateUrl: './student-exercise-card.component.html',
  styleUrl: './student-exercise-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExerciseCardComponent {

  readonly exercise = input.required<DayExercise>();
  readonly index    = input.required<number>();
  readonly done     = input<boolean>(false);

  readonly toggleDone = output<void>();

  readonly expanded = signal(false);

  repsLabel(): string {
    const ex = this.exercise();
    return repsRangeLabel(ex.reps, ex.repsMax) ?? '';
  }

  restText(): string {
    return restLabel(this.exercise().restSeconds) ?? '—';
  }

  muscleLabel(group: DayExercise['primaryMuscle']): string {
    return muscleGroupLabel(group);
  }

  toggleExpand(): void {
    this.expanded.update(v => !v);
  }

  onToggleDone(ev: Event): void {
    ev.stopPropagation();
    this.toggleDone.emit();
  }
}

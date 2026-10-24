// ─────────────────────────────────────────────
//  GymPlan — ExerciseDetailComponent (shared)
//  Contenido de "información del ejercicio": imagen,
//  nombre, badges, dificultad, descripción y técnica.
//
//  Extraído de ExerciseDetailPageComponent (Trainer) para
//  que Trainer y Student muestren EXACTAMENTE la misma
//  información con la misma lógica, sin duplicar nada.
//
//  Deliberadamente NO incluye:
//   - el botón "volver" ni el manejo de error/skeleton
//     (son de cada pantalla que lo envuelve)
//   - las acciones Editar/Eliminar/Crear variante/Usar en
//     plantilla (son mutaciones, solo tienen sentido en Trainer
//     y viven en ExerciseDetailPageComponent)
//
//  Cada sección ya era condicional al dato existir (patrón
//  "solo si el backend la mandó"). Eso es lo que permite que
//  Student, cuyo objeto no trae description/technique/equipment/
//  laterality/exerciseType/globalExercise, comparta el mismo
//  componente sin inventar esos campos: esas secciones
//  simplemente no se muestran.
// ─────────────────────────────────────────────

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MuscleGroup } from '../../../features/trainer/models/trainer.models';
import { muscleGroupLabel } from '../../../features/trainer/models/muscle-group.util';
import {
  difficultyLabel,
  exerciseTypeLabel,
  equipmentLabel,
  lateralityLabel,
  repsRangeLabel,
  restLabel,
} from '../../../features/trainer/models/exercise-meta.util';

import { BadgeComponent, BadgeVariant } from '../badge-component/badge.component';
import { MuscleIconComponent } from '../muscle-icon/muscle-icon.component';

/**
 * Lo que este componente necesita para mostrar un ejercicio.
 * `ExerciseDetail` (trainer.models.ts) cumple esta forma sin adaptar nada.
 * Student arma este objeto con un adaptador chico a partir de lo que trae
 * `StudentDayResponse.day.exercises[]`. Todo lo opcional que no llegue,
 * simplemente no se muestra.
 */
export interface ExerciseDetailViewModel {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[] | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  difficulty?: number | null;
  description?: string | null;
  techniqueSteps?: string[] | null;
  exerciseType?: string | null;
  equipment?: string | null;
  laterality?: string | null;
  defaultSets?: number | null;
  defaultRepsMin?: number | null;
  defaultRepsMax?: number | null;
  defaultRestSeconds?: number | null;
  parentExerciseName?: string | null;
  /** Ausente para Student (ese dato no viaja en su DTO) → oculta el badge y el aviso */
  global?: boolean;
}

export interface ExerciseStat {
  label: string;
  value: string;
}

@Component({
  selector: 'app-exercise-detail',
  standalone: true,
  imports: [CommonModule, BadgeComponent, MuscleIconComponent],
  templateUrl: './exercise-detail.component.html',
  styleUrl: './exercise-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseDetailComponent {

  readonly exercise = input.required<ExerciseDetailViewModel>();

  muscleLabel(mg: MuscleGroup): string {
    return muscleGroupLabel(mg);
  }

  statusBadge(ex: ExerciseDetailViewModel): { text: string; variant: BadgeVariant } {
    return ex.global
      ? { text: 'Global', variant: 'default' }
      : { text: 'Personal', variant: 'accent' };
  }

  exerciseTypeLabelFor(ex: ExerciseDetailViewModel): string | null {
    return exerciseTypeLabel(ex.exerciseType);
  }

  equipmentLabelFor(ex: ExerciseDetailViewModel): string | null {
    return equipmentLabel(ex.equipment);
  }

  lateralityLabelFor(ex: ExerciseDetailViewModel): string | null {
    return lateralityLabel(ex.laterality);
  }

  difficultyLabelFor(ex: ExerciseDetailViewModel): string | null {
    return difficultyLabel(ex.difficulty);
  }

  /** Series / Reps / Descanso — solo los que vienen cargados */
  stats(ex: ExerciseDetailViewModel): ExerciseStat[] {
    const out: ExerciseStat[] = [];
    if (ex.defaultSets != null) out.push({ label: 'Series', value: String(ex.defaultSets) });
    const reps = repsRangeLabel(ex.defaultRepsMin, ex.defaultRepsMax);
    if (reps) out.push({ label: 'Reps', value: reps });
    const rest = restLabel(ex.defaultRestSeconds);
    if (rest) out.push({ label: 'Descanso', value: rest });
    return out;
  }

  techniqueSteps(ex: ExerciseDetailViewModel): string[] {
    return (ex.techniqueSteps ?? []).filter(s => s && s.trim().length > 0);
  }
}

// ─────────────────────────────────────────────
//  GymPlan — ExerciseFormComponent
//  Formulario reutilizable de crear/editar ejercicio.
//  initialValue = null           → modo crear
//  initialValue = ExerciseDetail → modo editar
//  Campos alineados con ExerciseRequest del backend.
//  global / trainer / parentExercise los define el backend.
//  La técnica se escribe "un paso por línea" y se convierte a
//  techniqueSteps[] en toExercisePayload().
// ─────────────────────────────────────────────

import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { Equipment, ExerciseDetail, MuscleGroup } from '../../../models/trainer.models';
import { MUSCLE_GROUP_OPTIONS } from '../../../models/muscle-group.util';
import {
  ExerciseFormValueLike,
  ExerciseType,
  Laterality,
  EXERCISE_TYPE_OPTIONS,
  LATERALITY_OPTIONS,
  EQUIPMENT_OPTIONS,
  DIFFICULTY_OPTIONS,
  difficultyLabel,
} from '../../../models/exercise-meta.util';
import { InputFieldComponent } from '../../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';

export type ExerciseFormValue = ExerciseFormValueLike;

/** Igual que el @AssertTrue del backend: min <= max cuando ambos vienen */
function repsRangeValidator(group: AbstractControl): ValidationErrors | null {
  const min = group.get('defaultRepsMin')?.value;
  const max = group.get('defaultRepsMax')?.value;
  if (min == null || max == null || min === '' || max === '') return null;
  return Number(min) <= Number(max) ? null : { repsRange: true };
}

@Component({
  selector: 'app-exercise-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputFieldComponent, ButtonComponent],
  templateUrl: './exercise-form.component.html',
  styleUrl: './exercise-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseFormComponent {
  private readonly fb = inject(FormBuilder);

  // ── Inputs ──────────────────────────────────────
  readonly initialValue = input<ExerciseDetail | null>(null);
  readonly submitting   = input<boolean>(false);
  /** true = mantiene modo "crear" aunque initialValue tenga datos */
  readonly forceCreate  = input<boolean>(false);

  // ── Outputs ─────────────────────────────────────
  readonly save   = output<ExerciseFormValue>();
  readonly cancel = output<void>();

  readonly muscleGroupOptions  = MUSCLE_GROUP_OPTIONS;
  readonly exerciseTypeOptions = EXERCISE_TYPE_OPTIONS;
  readonly lateralityOptions   = LATERALITY_OPTIONS;
  readonly equipmentOptions    = EQUIPMENT_OPTIONS;
  readonly difficultyOptions   = DIFFICULTY_OPTIONS;

  readonly form: FormGroup = this.fb.group(
    {
      name:               ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      description:        ['', [Validators.maxLength(5000)]],
      primaryMuscle:      ['' as MuscleGroup | '', [Validators.required]],
      secondaryMuscles:   [[] as MuscleGroup[]],
      difficulty:         [null as number | null, [Validators.required, Validators.min(1), Validators.max(5)]],
      imageUrl:           ['', [Validators.maxLength(255)]],
      videoUrl:           ['', [Validators.maxLength(255)]],
      techniqueText:      [''],
      exerciseType:       ['' as ExerciseType | ''],
      equipment:          ['' as Equipment | ''],
      laterality:         ['' as Laterality | ''],
      defaultSets:        [null as number | null, [Validators.min(1)]],
      defaultRepsMin:     [null as number | null, [Validators.min(1)]],
      defaultRepsMax:     [null as number | null, [Validators.min(1)]],
      defaultRestSeconds: [null as number | null, [Validators.min(0)]],
    },
    { validators: repsRangeValidator },
  );

  constructor() {
    effect(() => {
      const ex = this.initialValue();
      if (ex) {
        this.form.reset({
          name:               ex.name,
          description:        ex.description ?? '',
          primaryMuscle:      ex.primaryMuscle,
          secondaryMuscles:   [...(ex.secondaryMuscles ?? [])],
          difficulty:         ex.difficulty ?? null,
          imageUrl:           ex.imageUrl ?? '',
          videoUrl:           ex.videoUrl ?? '',
          techniqueText:      (ex.techniqueSteps ?? []).join('\n'),
          exerciseType:       ex.exerciseType ?? '',
          equipment:          ex.equipment ?? '',
          laterality:         ex.laterality ?? '',
          defaultSets:        ex.defaultSets ?? null,
          defaultRepsMin:     ex.defaultRepsMin ?? null,
          defaultRepsMax:     ex.defaultRepsMax ?? null,
          defaultRestSeconds: ex.defaultRestSeconds ?? null,
        });
      } else {
        this.form.reset({
          name: '', description: '', primaryMuscle: '', secondaryMuscles: [],
          difficulty: null, imageUrl: '', videoUrl: '', techniqueText: '',
          exerciseType: '', equipment: '', laterality: '',
          defaultSets: null, defaultRepsMin: null, defaultRepsMax: null, defaultRestSeconds: null,
        });
      }
    });
  }

  get isEditMode(): boolean {
    return !this.forceCreate() && this.initialValue() !== null;
  }

  // ── Dificultad ──────────────────────────────────
  selectDifficulty(level: number): void {
    this.form.get('difficulty')?.setValue(level);
    this.form.get('difficulty')?.markAsTouched();
  }

  get currentDifficultyLabel(): string | null {
    return difficultyLabel(this.form.get('difficulty')?.value ?? null);
  }

  // ── Músculos secundarios (chips) ────────────────
  isSecondary(mg: MuscleGroup): boolean {
    return (this.form.get('secondaryMuscles')?.value as MuscleGroup[]).includes(mg);
  }

  isPrimary(mg: MuscleGroup): boolean {
    return this.form.get('primaryMuscle')?.value === mg;
  }

  toggleSecondary(mg: MuscleGroup): void {
    if (this.isPrimary(mg)) return;
    const ctrl = this.form.get('secondaryMuscles')!;
    const current = ctrl.value as MuscleGroup[];
    ctrl.setValue(current.includes(mg) ? current.filter(m => m !== mg) : [...current, mg]);
    ctrl.markAsDirty();
  }

  /** Si el principal elegido estaba como secundario, se saca de secundarios */
  onPrimaryChange(): void {
    const primary = this.form.get('primaryMuscle')?.value as MuscleGroup;
    const ctrl = this.form.get('secondaryMuscles')!;
    ctrl.setValue((ctrl.value as MuscleGroup[]).filter(m => m !== primary));
  }

  hasError(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.touched && c.invalid;
  }

  get repsRangeError(): boolean {
    return this.form.hasError('repsRange') &&
      (!!this.form.get('defaultRepsMin')?.touched || !!this.form.get('defaultRepsMax')?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue() as ExerciseFormValue);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

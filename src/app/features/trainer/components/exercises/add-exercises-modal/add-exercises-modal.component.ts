// ─────────────────────────────────────────────
//  GymPlan — AddExerciseModalComponent
//  Modal con dos pestañas:
//  Tab 1 — Seleccionar ejercicio existente
//  Tab 2 — Crear ejercicio nuevo
//
//  Uso:
//  <app-add-exercise-modal
//    [isOpen]="showModal()"
//    [exercises]="exercises()"
//    [exercisesLoading]="exercisesLoading()"
//    [isSaving]="isSaving()"
//    (closed)="showModal.set(false)"
//    (exerciseSelected)="onExerciseSelected($event)"
//    (exerciseCreated)="onExerciseCreated($event)"
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

import { Exercise, MuscleGroup, MUSCLE_GROUP_LABELS, AddExerciseToDayRequest, CreateExerciseRequest } from '../../../models/trainer.models';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { InputFieldComponent } from '../../../../../shared/components/input-field/input-field.component';

export type ModalTab = 'existing' | 'create';

// Lo que emite cuando se confirma un ejercicio existente
export interface ExerciseSelection {
  exerciseId: number;
  sets: number;
  reps: number;
  restSeconds: number;
  weight?: number;
  notes?: string;
}

@Component({
  selector: 'app-add-exercises-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, InputFieldComponent],
  templateUrl: './add-exercises-modal.component.html',
  styleUrl: './add-exercises-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExercisesModalComponent {

  // ── Inputs ────────────────────────────────────
  readonly isOpen           = input<boolean>(false);
  readonly exercises        = input<Exercise[]>([]);
  readonly exercisesLoading = input<boolean>(false);
  readonly isSaving         = input<boolean>(false);

  // ── Outputs ───────────────────────────────────
  readonly closed           = output<void>();
  readonly exerciseSelected = output<ExerciseSelection>();   // Tab 1
  readonly exerciseCreated  = output<CreateExerciseRequest>(); // Tab 2

  // ── Tab activa ────────────────────────────────
  readonly activeTab = signal<ModalTab>('existing');

  // ── Tab 1: seleccionar existente ──────────────
  readonly search             = signal('');
  readonly selectedExerciseId = signal<number | null>(null);
  readonly sets               = signal(3);
  readonly reps               = signal(10);
  readonly restSeconds        = signal(60);
  readonly weight             = signal(5);
  readonly notes              = signal('');

  readonly filteredExercises = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.exercises();
    return this.exercises().filter(e =>
      e.name.toLowerCase().includes(term) ||
      MUSCLE_GROUP_LABELS[e.muscleGroup]?.toLowerCase().includes(term)
    );
  });

  readonly canConfirmSelection = computed(() =>
    this.selectedExerciseId() !== null &&
    this.sets() > 0 &&
    this.reps() > 0
  );

  // ── Tab 2: crear nuevo ────────────────────────
  readonly newName         = signal('');
  readonly newDescription  = signal('');
  readonly newMuscleGroup  = signal<MuscleGroup | ''>('');
  readonly createSubmitted = signal(false);

  readonly muscleGroupOptions = Object.entries(MUSCLE_GROUP_LABELS) as [MuscleGroup, string][];

  readonly nameError = computed(() => {
    if (!this.createSubmitted()) return null;
    return this.newName().trim().length === 0 ? 'El nombre es requerido.' : null;
  });

  readonly muscleGroupError = computed(() => {
    if (!this.createSubmitted()) return null;
    return this.newMuscleGroup() === '' ? 'Seleccioná un grupo muscular.' : null;
  });

  readonly canCreate = computed(() =>
    this.newName().trim().length > 0 && this.newMuscleGroup() !== ''
  );

  // ── Reset al abrir ────────────────────────────
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetAll();
      }
    });
  }

  // ── Acciones ──────────────────────────────────

  switchTab(tab: ModalTab): void {
    this.activeTab.set(tab);
  }

  selectExercise(id: number): void {
    this.selectedExerciseId.set(
      this.selectedExerciseId() === id ? null : id
    );
  }

  confirmSelection(): void {
    const id = this.selectedExerciseId();
    if (!id || !this.canConfirmSelection()) return;

    this.exerciseSelected.emit({
      exerciseId:  id,
      sets:        this.sets(),
      reps:        this.reps(),
      restSeconds: this.restSeconds(),
      weight:      this.weight() > 0 ? this.weight() : undefined,
      notes:       this.notes().trim() || undefined,
    });
  }

  confirmCreate(): void {
    this.createSubmitted.set(true);
    if (!this.canCreate()) return;

    this.exerciseCreated.emit({
      name:        this.newName().trim(),
      description: this.newDescription().trim() || undefined,
      muscleGroup: this.newMuscleGroup() as MuscleGroup,
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  // ── Helpers ───────────────────────────────────

  getMuscleLabel(group: MuscleGroup): string {
    return MUSCLE_GROUP_LABELS[group] ?? group;
  }

  private resetAll(): void {
    this.activeTab.set('existing');
    // Tab 1
    this.search.set('');
    this.selectedExerciseId.set(null);
    this.sets.set(3);
    this.reps.set(10);
    this.restSeconds.set(60);
    this.notes.set('');
    // Tab 2
    this.newName.set('');
    this.newDescription.set('');
    this.newMuscleGroup.set('');
    this.createSubmitted.set(false);
  }
}
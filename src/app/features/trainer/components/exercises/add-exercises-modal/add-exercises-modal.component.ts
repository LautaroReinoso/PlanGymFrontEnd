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
  inject,
} from '@angular/core';
import { ExerciseService } from '../../../services/exercise.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Exercise, AddExerciseToDayRequest, CreateExerciseRequest } from '../../../models/trainer.models';
import { muscleGroupLabel } from '../../../models/muscle-group.util';
import { toExercisePayload } from '../../../models/exercise-meta.util';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { InputFieldComponent } from '../../../../../shared/components/input-field/input-field.component';
import { ExerciseItemBadge, ExerciseItemComponent } from '../../../../../shared/components/exercise-item/exercise-item.component';
import { ExerciseFormComponent, ExerciseFormValue } from '../exercise-form/exercise-form.component';

export type ModalTab = 'existing' | 'create';

// Lo que emite cuando se confirma un ejercicio existente
export interface ExerciseSelection {
  exerciseId: number;
  sets: number;
  reps: number;
  repsMax?: number;
  restSeconds: number;
  weight?: number;
  notes?: string;
}

@Component({
  selector: 'app-add-exercises-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, ExerciseItemComponent, ExerciseFormComponent],
  templateUrl: './add-exercises-modal.component.html',
  styleUrl: './add-exercises-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExercisesModalComponent {
  private readonly exerciseService = inject(ExerciseService);

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
  readonly repsMax            = signal<number | null>(null);
  readonly loadingDefaults    = signal(false);
  readonly restSeconds        = signal(60);
  readonly weight             = signal(0);
  readonly notes              = signal('');

  readonly filteredExercises = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.exercises();
    return this.exercises().filter(e =>
      e.name.toLowerCase().includes(term) ||
      muscleGroupLabel(e.primaryMuscle).toLowerCase().includes(term)
    );
  });

  readonly canConfirmSelection = computed(() =>
    this.selectedExerciseId() !== null &&
    this.sets() > 0 &&
    this.reps() > 0
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
    const next = this.selectedExerciseId() === id ? null : id;
    this.selectedExerciseId.set(next);
    if (next !== null) this.prefillFromDefaults(next);
  }

  /** Precarga series/reps/descanso con los valores sugeridos del ejercicio
   *  (si los tiene). El trainer los puede cambiar antes de confirmar. */
  private prefillFromDefaults(id: number): void {
    this.loadingDefaults.set(true);
    this.exerciseService.getById(id).subscribe({
      next: (d) => {
        this.loadingDefaults.set(false);
        if (this.selectedExerciseId() !== id) return; // cambió la selección
        if (d.defaultSets)              this.sets.set(d.defaultSets);
        if (d.defaultRepsMin)           this.reps.set(d.defaultRepsMin);
        this.repsMax.set(d.defaultRepsMax ?? null);
        if (d.defaultRestSeconds != null) this.restSeconds.set(d.defaultRestSeconds);
      },
      error: () => this.loadingDefaults.set(false), // se queda con los valores actuales
    });
  }

  confirmSelection(): void {
    const id = this.selectedExerciseId();
    if (!id || !this.canConfirmSelection()) return;

    this.exerciseSelected.emit({
      exerciseId:  id,
      sets:        this.sets(),
      reps:        this.reps(),
      repsMax:     this.repsMax() && this.repsMax()! > this.reps() ? this.repsMax()! : undefined,
      restSeconds: this.restSeconds(),
      weight:      this.weight() > 0 ? this.weight() : undefined,
      notes:       this.notes().trim() || undefined,
    });
  }

  // Tab 2 — delega la validación y el estado del formulario a ExerciseFormComponent
  onCreateFormSave(value: ExerciseFormValue): void {
    this.exerciseCreated.emit(toExercisePayload(value));
  }

  onClose(): void {
    this.closed.emit();
  }

  // ── Helpers ───────────────────────────────────

  getMuscleLabel(group: Exercise['primaryMuscle']): string {
    return muscleGroupLabel(group);
  }

  badgeFor(ex: Exercise): ExerciseItemBadge | null {
    return ex.global ? { text: 'Global', variant: 'default' } : null;
  }

  private resetAll(): void {
    this.activeTab.set('existing');
    // Tab 1
    this.search.set('');
    this.selectedExerciseId.set(null);
    this.sets.set(3);
    this.reps.set(10);
    this.repsMax.set(null);
    this.restSeconds.set(60);
    this.weight.set(0);
    this.notes.set('');
  }
}
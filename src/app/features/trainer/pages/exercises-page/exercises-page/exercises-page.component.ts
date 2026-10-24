import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

import {
  Equipment,
  Exercise,
  ExerciseDetail,
  ExerciseFilters,
  ExerciseScope,
  MuscleGroup,
} from '../../../models/trainer.models';
import { ExerciseService } from '../../../services/exercise.service';
import { MUSCLE_GROUP_OPTIONS, muscleGroupLabel } from '../../../models/muscle-group.util';
import {
  EQUIPMENT_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  ExerciseType,
  SCOPE_OPTIONS,
  equipmentLabel,
  toExercisePayload,
} from '../../../models/exercise-meta.util';
import { InputFieldComponent } from '../../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { SkeletonComponent } from '../../../../../shared/components/skeleton/skeleton.component';
import { ExerciseFormModalComponent } from '../../../components/exercises/exercise-form-modal/exercise-form-modal.component';
import { ExerciseFormValue } from '../../../components/exercises/exercise-form/exercise-form.component';
import { ExerciseItemBadge, ExerciseItemComponent } from '../../../../../shared/components/exercise-item/exercise-item.component';

@Component({
  selector: 'app-exercises-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputFieldComponent,
    ButtonComponent,
    SkeletonComponent,
    ExerciseItemComponent,
    ExerciseFormModalComponent,
  ],
  templateUrl: './exercises-page.component.html',
  styleUrl: './exercises-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExercisesPageComponent {
  private readonly exerciseService = inject(ExerciseService);
  private readonly router = inject(Router);

  // ── Estado ────────────────────────────────────
  readonly exercises = signal<Exercise[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving  = signal(false);
  readonly error     = signal<string | null>(null);

  // ── Filtros (se resuelven en el backend) ──────
  readonly search        = signal('');
  readonly scope         = signal<ExerciseScope>('ALL');
  readonly primaryMuscle = signal<MuscleGroup | ''>('');
  readonly equipment     = signal<Equipment | ''>('');
  readonly exerciseType  = signal<ExerciseType | ''>('');

  readonly scopeOptions        = SCOPE_OPTIONS;
  readonly muscleGroupOptions  = MUSCLE_GROUP_OPTIONS;
  readonly equipmentOptions    = EQUIPMENT_OPTIONS;
  readonly exerciseTypeOptions = EXERCISE_TYPE_OPTIONS;

  private readonly filters = computed<ExerciseFilters>(() => ({
    search:        this.search().trim() || undefined,
    scope:         this.scope(),
    primaryMuscle: this.primaryMuscle() || undefined,
    equipment:     this.equipment() || undefined,
    exerciseType:  this.exerciseType() || undefined,
  }));

  readonly hasActiveFilters = computed(() =>
    !!(this.search().trim() || this.scope() !== 'ALL' || this.primaryMuscle() ||
       this.equipment() || this.exerciseType()),
  );

  // ── Modal crear/editar ────────────────────────
  readonly isModalOpen     = signal(false);
  readonly editingExercise = signal<ExerciseDetail | null>(null);

  constructor() {
    // Cada cambio de filtro recarga desde el backend (debounce para el buscador;
    // switchMap descarta respuestas viejas si el usuario sigue tipeando).
    toObservable(this.filters).pipe(
      debounceTime(250),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      tap(() => { this.isLoading.set(true); this.error.set(null); }),
      switchMap(f => this.exerciseService.getAll(f).pipe(
        catchError(() => {
          this.error.set('No se pudieron cargar los ejercicios.');
          return of<Exercise[]>([]);
        }),
      )),
      takeUntilDestroyed(),
    ).subscribe(list => {
      this.exercises.set(list);
      this.isLoading.set(false);
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.scope.set('ALL');
    this.primaryMuscle.set('');
    this.equipment.set('');
    this.exerciseType.set('');
  }

  detailFor(ex: Exercise): string {
    const parts = [muscleGroupLabel(ex.primaryMuscle), equipmentLabel(ex.equipment)];
    return parts.filter(Boolean).join(' · ');
  }

  badgeFor(ex: Exercise): ExerciseItemBadge {
    if (ex.global) return { text: 'Global', variant: 'default' };
    return ex.parentExerciseId
      ? { text: 'Variante', variant: 'accent' }
      : { text: 'Personal', variant: 'accent' };
  }

  onOpenCreate(): void {
    this.editingExercise.set(null);
    this.isModalOpen.set(true);
  }

  openDetail(ex: Exercise): void {
    this.router.navigate(['/trainer/exercises', ex.id]);
  }

  /** El item de listado no trae técnica ni secundarios: se pide el detalle antes de editar */
  onEdit(ex: Exercise): void {
    if (ex.global) return;
    this.exerciseService.getById(ex.id).subscribe({
      next: (detail) => {
        if (!detail.canEdit) return;
        this.editingExercise.set(detail);
        this.isModalOpen.set(true);
      },
      error: () => this.error.set('No se pudo abrir el ejercicio para editar.'),
    });
  }

  onDelete(ex: Exercise): void {
    if (ex.global) return;
    if (!confirm(`¿Eliminar "${ex.name}"? Se quita de tu catálogo; las plantillas que ya lo usan no se modifican.`)) return;

    this.exerciseService.delete(ex.id).subscribe({
      next: () => this.exercises.update(list => list.filter(e => e.id !== ex.id)),
      error: () => this.error.set('No se pudo eliminar el ejercicio.'),
    });
  }

  onModalClosed(): void {
    this.isModalOpen.set(false);
    this.editingExercise.set(null);
  }

  onSaveExercise(value: ExerciseFormValue): void {
    this.isSaving.set(true);
    const editing = this.editingExercise();
    const payload = toExercisePayload(value);

    const request = editing
      ? this.exerciseService.update(editing.id, payload)
      : this.exerciseService.create(payload);

    request.subscribe({
      next: (saved) => {
        const item = this.toListItem(saved);
        if (editing) {
          this.exercises.update(list => list.map(e => (e.id === editing.id ? item : e)));
        } else {
          this.exercises.update(list => [item, ...list]);
        }
        this.isSaving.set(false);
        this.onModalClosed();
      },
      error: () => {
        this.error.set('No se pudo guardar el ejercicio.');
        this.isSaving.set(false);
      },
    });
  }

  /** create/update devuelven el detalle; para la lista alcanza con el resumen */
  private toListItem(d: ExerciseDetail): Exercise {
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      primaryMuscle: d.primaryMuscle,
      exerciseType: d.exerciseType,
      equipment: d.equipment,
      laterality: d.laterality,
      difficulty: d.difficulty,
      imageUrl: d.imageUrl,
      global: d.global,
      parentExerciseId: d.parentExerciseId,
    };
  }
}

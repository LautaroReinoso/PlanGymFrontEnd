// ─────────────────────────────────────────────
//  GymPlan — TemplateDetailPageComponent
//  Fix #2/#3: onExerciseSelected completo
//  Fix #4: onExerciseCreated completo
//  Fix #5: dead code eliminado de addDay()
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TemplateService } from '../../services/template.service';
import { ExerciseService } from '../../services/exercise.service';
import {
  WorkoutTemplate,
  WorkoutTemplateDay,
  Exercise,
  MuscleGroup,
  UpdateTemplateRequest,
  CreateExerciseRequest,
} from '../../models/trainer.models';
import { muscleGroupLabel } from '../../models/muscle-group.util';

import { TemplateDayComponent } from '../../components/templates/template-day/template-day.component';
import { TemplateEditModalComponent } from '../../components/templates/template-edit-modal/template-edit-modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import {
  AddExercisesModalComponent,
  ExerciseSelection,
} from '../../components/exercises/add-exercises-modal/add-exercises-modal.component';
import { EditDayModalComponent, UpdateDayRequest } from '../../components/templates/edit-day-modal/edit-day-modal.component';
import { BadgeComponent } from "../../../../shared/components/badge-component/badge.component";
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { GymLoaderComponent } from '../../../../shared/components/gym-loader/gym-loader.component';
@Component({
  selector: 'app-template-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    TemplateDayComponent,
    TemplateEditModalComponent,
    ButtonComponent,
    ModalComponent,
    AddExercisesModalComponent,
    EditDayModalComponent,
    BadgeComponent,
    IconButtonComponent,
    GymLoaderComponent
],
  templateUrl: './template-detail-page.component.html',
  styleUrl: './template-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDetailPageComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templateSvc = inject(TemplateService);
  private readonly exerciseSvc = inject(ExerciseService);

  // ── Estado principal ──────────────────────────
  readonly template = signal<WorkoutTemplate | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly templateId = computed(() =>
    Number(this.route.snapshot.paramMap.get('id'))
  );

  // ── Día seleccionado ──────────────────────────
  readonly selectedDayId = signal<number | null>(null);

  readonly sortedDays = computed(() =>
    [...(this.template()?.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
  );

  // ── Resumen por grupo muscular (agregado de todos los días) ──
  readonly muscleGroupSummary = computed(() => {
    const days = this.template()?.days ?? [];
    const counts = new Map<MuscleGroup, number>();

    for (const day of days) {
      for (const ex of day.exercises) {
        counts.set(ex.primaryMuscle, (counts.get(ex.primaryMuscle) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([muscleGroup, count]) => ({
        muscleGroup,
        label: muscleGroupLabel(muscleGroup),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly selectedDay = computed<WorkoutTemplateDay | null>(() => {
    const id = this.selectedDayId();
    if (id === null) return null;
    return this.sortedDays().find(d => d.id === id) ?? null;
  });

  // Auto-selección: primer día al cargar, re-selección si el activo se elimina
  constructor() {
    effect(() => {
      const days = this.sortedDays();
      const currentId = this.selectedDayId();
      const stillExists = days.some(d => d.id === currentId);

      if (days.length > 0 && (!currentId || !stillExists)) {
        this.selectedDayId.set(days[0].id);
      }
      if (days.length === 0) {
        this.selectedDayId.set(null);
      }
    });
  }

  // ── Agregar día ───────────────────────────────
  readonly isAddingDay = signal(false);
  readonly canAddDay = computed(() => this.sortedDays().length < 7);

  // ── Modal: agregar ejercicio ──────────────────
  readonly showExerciseModal = signal(false);
  readonly exercises = signal<Exercise[]>([]);
  readonly exercisesLoading = signal(false);
  readonly isAddingExercise = signal(false);

  // ── Modal: editar info ────────────────────────

  readonly isSavingEdit = signal(false);
  readonly editError = signal<string | null>(null);

  // ── Modal: editar day────────────────────────
  readonly showEditDayModal = signal(false);
  readonly isSavingDay = signal(false);
  readonly editDayError = signal<string | null>(null);
  // ── Modal: eliminar plantilla ─────────────────
    readonly showEditTemplateModal = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly isDeleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.loadTemplate();
  }

  loadTemplate(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.templateSvc.getById(this.templateId()).subscribe({
      next: (data) => {
        this.template.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la plantilla.');
        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/trainer/templates']);
  }

  // ── Selección de día ──────────────────────────
  selectDay(dayId: number): void {
    this.selectedDayId.set(dayId);
  }

  // ── Agregar día ───────────────────────────────
  // FIX #5: eliminado dead code de nextDayNumber/dayLetter
  // El backend genera el nombre automáticamente (Día A, Día B…)
  addDay(): void {
    if (!this.canAddDay() || this.isAddingDay()) return;

    this.isAddingDay.set(true);

    this.templateSvc.addDay(this.templateId()).subscribe({
      next: (newDay) => {
        this.isAddingDay.set(false);
        this.template.update(t => t ? { ...t, days: [...t.days, newDay] } : t);
        this.selectedDayId.set(newDay.id);
      },
      error: () => {
        this.isAddingDay.set(false);
        this.error.set('No se pudo agregar el día.');
      },
    });
  }

  removeDay(dayId: number): void {
    this.templateSvc.deleteDay(this.templateId(), dayId).subscribe({
      next: () => {
        this.template.update(t => t
          ? { ...t, days: this.renumber(t.days.filter(d => d.id !== dayId)) }
          : t
        );
      },
      error: () => this.error.set('No se pudo eliminar el día.'),
    });
  }

  // ── Ejercicios ────────────────────────────────

  openExerciseModal(): void {
    this.showExerciseModal.set(true);

    // Cargar ejercicios solo la primera vez
    if (this.exercises().length === 0) {
      this.exercisesLoading.set(true);
      this.exerciseSvc.getAll().subscribe({
        next: (data) => { this.exercises.set(data); this.exercisesLoading.set(false); },
        error: () => { this.exercisesLoading.set(false); },
      });
    }
  }

  // FIX #2/#3: completo — cierra modal y actualiza signal local
  onExerciseSelected(selection: ExerciseSelection): void {

    const dayId = this.selectedDayId();
    if (!dayId) return;

    const order = (this.selectedDay()?.exercises.length ?? 0) + 1;

    this.isAddingExercise.set(true);

    this.templateSvc.addExerciseToDay(dayId, {
      exerciseId: selection.exerciseId,
      sets: selection.sets,
      reps: selection.reps,
      repsMax: selection.repsMax,
      restSeconds: selection.restSeconds,
      weightSuggestion: selection.weight,
      orderIndex: order,
      notes: selection.notes

    }).subscribe({
      next: (newExercise) => {
        this.isAddingExercise.set(false);
        this.showExerciseModal.set(false);
        // Parchear solo el día afectado — sin recargar todo el template
        this.template.update(t => t ? {
          ...t,
          days: t.days.map(d =>
            d.id === dayId
              ? { ...d, exercises: [...d.exercises, newExercise] }
              : d
          ),
        } : t);
      },
      error: () => {
        this.isAddingExercise.set(false);
      },
    });
  }

  // FIX #4: completo — crea el ejercicio y luego lo agrega al día
  onExerciseCreated(dto: CreateExerciseRequest): void {
    const dayId = this.selectedDayId();
    if (!dayId) return;

    const order = (this.selectedDay()?.exercises.length ?? 0) + 1;

    this.isAddingExercise.set(true);

    this.exerciseSvc.create(dto).subscribe({
      next: (newExercise) => {
        // Ejercicio creado → ahora agregarlo al día seleccionado
        this.templateSvc.addExerciseToDay(dayId, {
          exerciseId: newExercise.id,
          sets: 3,
          reps: 10,
          restSeconds: 60,
          orderIndex: order,
        }).subscribe({
          next: (newDayExercise) => {
            this.isAddingExercise.set(false);
            this.showExerciseModal.set(false);
            this.template.update(t => t ? {
              ...t,
              days: t.days.map(d =>
                d.id === dayId
                  ? { ...d, exercises: [...d.exercises, newDayExercise] }
                  : d
              ),
            } : t);
          },
          error: () => {
            this.isAddingExercise.set(false);
          },
        });
      },
      error: () => {
        this.isAddingExercise.set(false);
      },
    });
  }

  removeExercise(exerciseId: number): void {
    const dayId = this.selectedDayId();
    if (!dayId) return;

    this.templateSvc.removeExerciseFromDay(dayId, exerciseId).subscribe({
      next: () => {
        this.template.update(t => t ? {
          ...t,
          days: t.days.map(d =>
            d.id === dayId
              ? { ...d, exercises: this.renumber(d.exercises.filter(e => e.id !== exerciseId)) }
              : d
          ),
        } : t);
      },
      error: () => this.error.set('No se pudo eliminar el ejercicio.'),
    });
  }

  /**
   * Reordena los ejercicios del día seleccionado (drag & drop).
   * Optimista: se actualiza el signal al instante y, si el PATCH falla,
   * se restaura el snapshot previo.
   */
  onReorderExercises(orderedIds: number[]): void {
    const day = this.selectedDay();
    if (!day) return;

    const snapshot = this.template();
    const byId = new Map(day.exercises.map(e => [e.id, e]));
    const reordered = orderedIds
      .map((id, i) => {
        const ex = byId.get(id);
        return ex ? { ...ex, orderIndex: i + 1 } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    if (reordered.length !== day.exercises.length) return; // lista inconsistente: no tocar nada

    this.template.update(t => t ? {
      ...t,
      days: t.days.map(d => d.id === day.id ? { ...d, exercises: reordered } : d),
    } : t);

    // El backend espera WorkoutDay.id (workoutDayId), no WorkoutTemplateDay.id
    this.templateSvc.reorderExercises(day.workoutDayId, orderedIds).subscribe({
      error: () => {
        this.template.set(snapshot);
        this.error.set('No se pudo guardar el nuevo orden de los ejercicios.');
      },
    });
  }

  // ── Editar info ───────────────────────────────
  openEditModal(): void {
    this.editError.set(null);
    this.showEditDayModal.set(true);
  }
    openEditTemplateModal(): void {
    this.editError.set(null);
    this.showEditTemplateModal.set(true);
  }

  confirmEdit(dto: UpdateTemplateRequest): void {
    this.isSavingEdit.set(true);
    this.editError.set(null);

    this.templateSvc.update(this.templateId(), dto).subscribe({
      next: (updated) => {
        this.isSavingEdit.set(false);
        this.showEditTemplateModal.set(false);
        // Parchear solo name/description — conservar days intactos
        this.template.update(t => t
          ? { ...t, name: updated.name, description: updated.description }
          : t
        );
      },
      error: () => {
        this.isSavingEdit.set(false);
        this.editError.set('No se pudo actualizar la plantilla.');
      },
    });
  }

  // ── Eliminar plantilla ────────────────────────
  openDeleteConfirm(): void {
    this.deleteError.set(null);
    this.showDeleteConfirm.set(true);
  }

  confirmDelete(): void {
    this.isDeleting.set(true);

    this.templateSvc.delete(this.templateId()).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.router.navigate(['/trainer/templates']);
      },
      error: () => {
        this.isDeleting.set(false);
        this.deleteError.set('No se pudo eliminar la plantilla.');
        this.showDeleteConfirm.set(false);
      },
    });
  }
  // método que llama el template-day via output
  onEditDay(): void {
    this.editDayError.set(null);
    this.showEditDayModal.set(true);
  }
onDaySaved(dto: UpdateDayRequest): void {
  const day = this.selectedDay();
  if (!day) return;

  this.isSavingDay.set(true);

  // ✅ workoutDayId — el que espera el endpoint
  this.templateSvc.updateDay(this.templateId(), day.workoutDayId, dto).subscribe({
    next: () => {
      // Si cambió el orden, el backend desplaza a los demás días: se recarga el
      // template para tener los orderIndex consistentes (1..n).
      this.templateSvc.getById(this.templateId()).subscribe({
        next: (data) => {
          this.template.set(data);
          this.selectedDayId.set(day.id);
          this.isSavingDay.set(false);
          this.showEditDayModal.set(false);
        },
        error: () => {
          this.isSavingDay.set(false);
          this.showEditDayModal.set(false);
          this.error.set('El día se guardó, pero no se pudo recargar la plantilla.');
        },
      });
    },
    error: () => {
      this.isSavingDay.set(false);
      this.editDayError.set('No se pudo guardar el día.');
    },
  });
}

  /** Renumera 1..n respetando el orden actual (tras borrar, sin recargar del server). */
  private renumber<T extends { orderIndex: number }>(items: T[]): T[] {
    return [...items]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item, i) => ({ ...item, orderIndex: i + 1 }));
  }
}

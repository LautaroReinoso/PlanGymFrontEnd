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
  UpdateTemplateRequest,
  CreateExerciseRequest,
} from '../../models/trainer.models';

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
@Component({
  selector: 'app-template-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    TemplateDayComponent,
    TemplateEditModalComponent,
    ButtonComponent,
    SkeletonComponent,
    ModalComponent,
    AddExercisesModalComponent,
    EditDayModalComponent
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
    [...(this.template()?.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber)
  );

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
  readonly showEditModal = signal(false);
  readonly isSavingEdit = signal(false);
  readonly editError = signal<string | null>(null);

  // ── Modal: editar day────────────────────────
  readonly showEditDayModal = signal(false);
  readonly isSavingDay = signal(false);
  readonly editDayError = signal<string | null>(null);
  // ── Modal: eliminar plantilla ─────────────────
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
          ? { ...t, days: t.days.filter(d => d.id !== dayId) }
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
      restSeconds: selection.restSeconds,
      weight: selection.weight,
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
        this.templateSvc.addExerciseToDay(this.templateId(), {
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
              ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId) }
              : d
          ),
        } : t);
      },
      error: () => this.error.set('No se pudo eliminar el ejercicio.'),
    });
  }

  // ── Editar info ───────────────────────────────
  openEditModal(): void {
    console.log('openEditModal called');
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  confirmEdit(dto: UpdateTemplateRequest): void {
    this.isSavingEdit.set(true);
    this.editError.set(null);

    this.templateSvc.update(this.templateId(), dto).subscribe({
      next: (updated) => {
        this.isSavingEdit.set(false);
        this.showEditModal.set(false);
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
  this.templateSvc.updateDay(day.workoutDayId, dto).subscribe({
    next: (updatedDay) => {
      this.isSavingDay.set(false);
      this.showEditDayModal.set(false);
      // Parchear el signal local con name y description actualizados
      this.template.update(t => t ? {
        ...t,
        days: t.days.map(d =>
          d.id === day.id
            ? { ...d, name: updatedDay.name, description: updatedDay.description }
            : d
        ),
      } : t);
    },
    error: () => {
      this.isSavingDay.set(false);
      this.editDayError.set('No se pudo guardar el día.');
    },
  });
}
}
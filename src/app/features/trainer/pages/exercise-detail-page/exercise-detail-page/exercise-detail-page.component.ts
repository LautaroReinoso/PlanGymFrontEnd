// ─────────────────────────────────────────────
//  GymPlan — ExerciseDetailPageComponent
//  Detalle de un ejercicio del catálogo.
//  La info general (imagen, nombre, badges, dificultad,
//  descripción, técnica) vive en <app-exercise-detail>
//  (shared/components/exercise-detail), compartido con Student.
//  Esta página se queda con: fetch por id, back button,
//  estado de carga/error, y las acciones de mutación
//  (Editar/Eliminar/Crear variante/Usar en plantilla),
//  que son exclusivas de Trainer.
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

import { ExerciseService } from '../../../services/exercise.service';
import { ExerciseDetail } from '../../../models/trainer.models';
import { toExercisePayload } from '../../../models/exercise-meta.util';

import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { GymLoaderComponent } from '../../../../../shared/components/gym-loader/gym-loader.component';
import { ExerciseDetailComponent } from '../../../../../shared/components/exercise-detail/exercise-detail.component';
import { ExerciseFormModalComponent } from '../../../components/exercises/exercise-form-modal/exercise-form-modal.component';
import { ExerciseFormValue } from '../../../components/exercises/exercise-form/exercise-form.component';

@Component({
  selector: 'app-exercise-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    GymLoaderComponent,
    ExerciseDetailComponent,
    ExerciseFormModalComponent,
  ],
  templateUrl: './exercise-detail-page.component.html',
  styleUrl: './exercise-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseDetailPageComponent {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly exerciseService  = inject(ExerciseService);

  private exerciseId = Number(this.route.snapshot.paramMap.get('id'));

  // ── Estado ────────────────────────────────────
  readonly exercise  = signal<ExerciseDetail | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving  = signal(false);
  readonly error     = signal<string | null>(null);

  // ── Modal editar ──────────────────────────────
  readonly isModalOpen = signal(false);

  constructor() {
    // paramMap (no snapshot): "Crear variante" navega a /exercises/:nuevoId
    // y Angular reutiliza este mismo componente.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.exerciseId = Number(params.get('id'));
      this.isModalOpen.set(false);
      this.loadExercise();
    });
  }

  loadExercise(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.exerciseService.getById(this.exerciseId).subscribe({
      next: (data) => {
        this.exercise.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar este ejercicio.');
        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/trainer/exercises']);
  }

  // ── Acciones ──────────────────────────────────
  // Qué botones se muestran lo decide el backend (canEdit / canCreateVariant).

  onEdit(): void {
    if (!this.exercise()?.canEdit) return;
    this.isModalOpen.set(true);
  }

  onDelete(): void {
    const ex = this.exercise();
    if (!ex?.canEdit) return;
    if (!confirm(`¿Eliminar "${ex.name}"? Se quita de tu catálogo; las plantillas que ya lo usan no se modifican.`)) return;

    this.isSaving.set(true);
    this.exerciseService.delete(ex.id).subscribe({
      next: () => this.router.navigate(['/trainer/exercises']),
      error: () => {
        this.error.set('No se pudo eliminar el ejercicio.');
        this.isSaving.set(false);
      },
    });
  }

  /** El backend clona el ejercicio (con técnica y músculos) como propio;
   *  navegamos al nuevo y abrimos el editor para ajustarlo. */
  onCreateVariant(): void {
    const ex = this.exercise();
    if (!ex?.canCreateVariant) return;

    this.isSaving.set(true);
    this.error.set(null);
    this.exerciseService.createVariant(ex.id).subscribe({
      next: (variant) => {
        this.isSaving.set(false);
        this.router.navigate(['/trainer/exercises', variant.id]);
      },
      error: () => {
        this.error.set('No se pudo crear la variante.');
        this.isSaving.set(false);
      },
    });
  }

  onUseInTemplate(): void {
    // Agregar el ejercicio se hace desde el detalle de una plantilla
    // (AddExercisesModal → "Existentes"). El backend prellena series/reps/
    // descanso con los valores sugeridos del ejercicio si vienen vacíos.
    this.router.navigate(['/trainer/templates']);
  }

  // ── Modal ──────────────────────────────────────
  onModalClosed(): void {
    this.isModalOpen.set(false);
  }

  onSaveExercise(value: ExerciseFormValue): void {
    const ex = this.exercise();
    if (!ex) return;

    this.isSaving.set(true);
    this.exerciseService.update(ex.id, toExercisePayload(value)).subscribe({
      next: (saved) => {
        this.exercise.set(saved);
        this.isSaving.set(false);
        this.onModalClosed();
      },
      error: () => {
        this.error.set('No se pudo guardar el ejercicio.');
        this.isSaving.set(false);
      },
    });
  }
}

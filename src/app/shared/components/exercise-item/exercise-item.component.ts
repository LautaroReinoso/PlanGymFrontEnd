import { CommonModule } from '@angular/common';
import { BadgeComponent, BadgeVariant } from '../badge-component/badge.component';

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { MuscleIconComponent } from '../muscle-icon/muscle-icon.component';
import { MuscleGroup } from '../../../features/trainer/models/trainer.models';



export interface ExerciseItemBadge {
  text: string;
  variant: BadgeVariant;
}
@Component({
  selector: 'app-exercise-item',
    standalone: true,
  imports: [CommonModule, MuscleIconComponent, BadgeComponent],
  templateUrl: './exercise-item.component.html',
  styleUrl: './exercise-item.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseItemComponent {

  // ── Contenido ─────────────────────────────────
  readonly name        = input.required<string>();
  readonly muscleGroup = input<MuscleGroup | null>(null);
  readonly detail      = input<string>('');            // "3 series · 10 reps · 60s" | "Pecho"
  readonly index       = input<number | null>(null);   // número de orden (contexto día)
  readonly badge       = input<ExerciseItemBadge | null>(null); // "Global" / "Personal"

  // ── Interacción ───────────────────────────────
  readonly clickable  = input<boolean>(false);
  readonly selected   = input<boolean>(false);  // contexto selección (ej: AddExercisesModal)
  readonly showRemove = input<boolean>(false); // contexto día
  readonly showEdit   = input<boolean>(false); // contexto catálogo
  readonly showDelete = input<boolean>(false); // contexto catálogo

  readonly itemClick = output<void>();
  readonly remove    = output<void>();
  readonly edit      = output<void>();
  readonly delete    = output<void>();

  // ── Handlers ──────────────────────────────────
  onItemClick(): void {
    if (this.clickable()) this.itemClick.emit();
  }
  onRemove(ev: Event): void { ev.stopPropagation(); this.remove.emit(); }
  onEdit(ev: Event):   void { ev.stopPropagation(); this.edit.emit(); }
  onDelete(ev: Event): void { ev.stopPropagation(); this.delete.emit(); }
}
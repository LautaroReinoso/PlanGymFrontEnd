import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MuscleGroup } from '../../../features/trainer/models/trainer.models';

@Component({
  selector: 'gp-muscle-icon',
  standalone: true,
  imports: [],
  templateUrl: './muscle-icon.component.html',
  styleUrl: './muscle-icon.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuscleIconComponent {

   readonly muscleGroup = input.required<MuscleGroup>();
  /** Ancho en px. La altura se calcula automáticamente (proporción 1:1.42). Default 24px según design system. */
  readonly size = input<number>(24);
}

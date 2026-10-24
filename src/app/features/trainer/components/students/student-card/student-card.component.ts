import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentSummary } from '../../../models/trainer.models';
import { AvatarComponent } from '../../../../../shared/components/avatar/avatar.component';

export type StudentStatus = 'active' | 'no-plan' | 'pending';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCardComponent {

  readonly student = input.required<StudentSummary>();

  // Output para navegar al detalle
  readonly cardClick = output<void>();

  // ── Computed ──────────────────────────────────

  // Estado derivado del modelo
  readonly status = computed<StudentStatus>(() => {
    const s = this.student();
    if (!s.fullName) return 'pending';
    if (!s.activeWorkout) return 'no-plan';
    return 'active';
  });

  // Iniciales: del nombre si existe, del DNI si no
  readonly initials = computed(() => {
    const s = this.student();
    if (s.fullName) {
      const parts = s.fullName.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    // Sin nombre: primeros 2 dígitos del DNI
    return s.dni.toString().slice(0, 2);
  });




  // DNI formateado: 35456123 → 35.456.123
  readonly dniFormatted = computed(() => {
    const dni = this.student().dni.toString();
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  });

  // Nombre para mostrar
  readonly displayName = computed(() => {
    const s = this.student();
    return s.fullName ?? `DNI ${this.dniFormatted()}`;
  });

  // Días por semana — texto
  readonly daysLabel = computed(() => {
    const days = this.student().activeWorkout?.dayCount;
    if (!days) return null;
    return `${days} ${days === 1 ? 'día' : 'días'} por semana`;
  });

  onClick(): void {
    this.cardClick.emit();
  }
}
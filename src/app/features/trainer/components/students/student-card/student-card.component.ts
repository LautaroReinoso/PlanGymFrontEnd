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
  /** "Próxima clase: jue 12 nov 18:00" (solo con Turnos prendido) */
  readonly turnos = input<string | null>(null);

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
    // Sin nombre: primeros 2 dígitos del DNI (o "?" si tampoco hay DNI)
    return s.dni ? String(s.dni).slice(0, 2) : '?';
  });




  // DNI formateado: 35456123 → 35.456.123
  readonly dniFormatted = computed(() => {
    const dni = this.student().dni;
    if (!dni) return '';
    return String(dni).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  });

  // Nombre para mostrar
  readonly displayName = computed(() => {
    const s = this.student();
    if (s.fullName?.trim()) return s.fullName;
    return s.dni ? `DNI ${this.dniFormatted()}` : 'Sin nombre ni DNI';
  });

  // Días por semana — texto
  readonly daysLabel = computed(() => {
    const days = this.student().activeWorkout?.dayCount;
    if (!days) return null;
    return `${days} ${days === 1 ? 'día' : 'días'} por semana`;
  });

  readonly statusText = computed(() =>
    ({ active: 'Activo', 'no-plan': 'Sin plan', pending: 'Pendiente' } as const)[this.status()]);

  /** % que calcula el backend; null = todavía no hay dato */
  readonly adherence = computed(() => {
    const v = this.student().adherencePercent;
    return v === null || v === undefined ? null : Math.round(v);
  });

  /** Umbral solo visual: ≥70 verde, 40–69 ámbar, <40 rojo */
  readonly adherenceLevel = computed(() => {
    const v = this.adherence();
    if (v === null) return 'none';
    return v >= 70 ? 'high' : v >= 40 ? 'mid' : 'low';
  });

  readonly ariaLabel = computed(() => {
    const parts = [`Ver detalle de ${this.displayName()}`, this.statusText()];
    const w = this.student().activeWorkout;
    if (w) parts.push(`plan ${w.templateName}`);
    if (this.adherence() !== null) parts.push(`adherencia ${this.adherence()}%`);
    return parts.join(', ');
  });

  onClick(): void {
    this.cardClick.emit();
  }
}
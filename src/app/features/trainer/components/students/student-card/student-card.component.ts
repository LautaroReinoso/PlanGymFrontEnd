// ─────────────────────────────────────────────
//  GymPlan — StudentCardComponent
//  Tarjeta reutilizable para un alumno.
//  Input: StudentSummary. Navega al detalle.
// ─────────────────────────────────────────────

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { StudentSummary } from '../../../models/trainer.models';
import { BadgeComponent } from '../../../../../shared/components/badge-component/badge.component';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './student-card.component.html',
  styleUrl: './student-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCardComponent {

  readonly student = input.required<StudentSummary>();

  // Iniciales del mail para el avatar
  readonly initials = computed(() => {
    const mail = this.student().mail;
    return mail.charAt(0).toUpperCase();
  });

  // Color del avatar según si tiene plan activo
  readonly avatarMod = computed(() =>
    this.student().activeWorkout ? 'active' : 'inactive'
  );

  // Nombre para mostrar: fullName si existe, sino parte del mail
  readonly displayName = computed(() => {
    const s = this.student();
    return s.fullName ?? s.mail.split('@')[0];
  });
}
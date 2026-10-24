// ─────────────────────────────────────────────
//  GymPlan — StudentDetailPageComponent
//  Usa StudentDetail con activeWorkout,
//  workoutHistory, recentLogs y adherencia.
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { StudentService } from '../../../services/student.service';
import { TemplateService } from '../../../services/template.service';
import { AssignmentService } from '../../../services/assignment.service';

import {
 
  WorkoutTemplateDay,
  WorkoutTemplateSummary,
} from '../../../models/trainer.models';
import {  StudentDetail } from '../../../models/student.models';
import { ButtonComponent }   from '../../../../../shared/components/button-component/button-component.component';
import { SkeletonComponent } from '../../../../../shared/components/skeleton/skeleton.component';
import { ModalComponent }    from '../../../../../shared/components/modal/modal.component';
import { BadgeComponent }    from '../../../../../shared/components/badge-component/badge.component';
import { AvatarComponent }  from '../../../../../shared/components/avatar/avatar.component';
import { DayBadgeComponent } from '../../../../../shared/components/day-badge/day-badge.component';
import { TemplateDayComponent } from "../../../components/templates/template-day/template-day.component";
import { GymLoaderComponent } from '../../../../../shared/components/gym-loader/gym-loader.component';
@Component({
  selector: 'app-student-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    ButtonComponent,
    SkeletonComponent,
    ModalComponent,
    AvatarComponent,
    DayBadgeComponent,
    TemplateDayComponent,
    GymLoaderComponent
],
  templateUrl: './student-detail-page.component.html',
  styleUrl: './student-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetailPageComponent implements OnInit {

  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly studentSvc  = inject(StudentService);
  private readonly templateSvc = inject(TemplateService);
  private readonly assignSvc   = inject(AssignmentService);

  // ── Estado ────────────────────────────────────
  readonly student   = signal<StudentDetail | null>(null);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);

  // ── Modal asignación ──────────────────────────
  readonly showAssignModal  = signal(false);
  readonly templates        = signal<WorkoutTemplateSummary[]>([]);
  readonly templatesLoading = signal(false);
  readonly selectedTemplate = signal<number | null>(null);
  readonly isAssigning      = signal(false);
  readonly assignError      = signal<string | null>(null);

  
  // ── Estado de la vista de rutina ──────────────
readonly selectedDayIndex = signal<number>(0);
  // ── Computed ──────────────────────────────────
  readonly studentId = computed(() =>
    Number(this.route.snapshot.paramMap.get('id'))
  );
readonly selectedDay = computed<WorkoutTemplateDay | null>(() => {
  const days = this.student()?.activeTemplate?.days;
  if (!days?.length) return null;
  return days[this.selectedDayIndex()] ?? null;
});


  readonly initials = computed(() => {
    const s = this.student();
    if (!s) return '?';
    if (s.fullName) {
      const parts = s.fullName.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return s.dni.toString().slice(0, 2);
  });

  readonly displayName = computed(() => {
    const s = this.student();
    if (!s) return '';
    return s.fullName ?? `DNI ${this.dniFormatted()}`;
  });

  readonly dniFormatted = computed(() => {
    const s = this.student();
    if (!s) return '';
    return s.dni.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  });

  readonly adherenceColor = computed(() => {
    const pct = this.student()?.adherencePercent ?? 0;
    if (pct >= 80) return '#22C55E';
    if (pct >= 50) return '#F59E0B';
    return '#EF4444';
  });

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.loadStudent();
  }

  loadStudent(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studentSvc.getStudentById(this.studentId()).subscribe({
      next: (data: any) => {
        this.student.set(data);
        this.isLoading.set(false);
        
    console.log(this.student())
      },
      error: () => {
        this.error.set('No se pudo cargar el alumno.');
        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/trainer/students']);
  }

  // ── Modal asignar plan ────────────────────────
  openAssignModal(): void {
    this.selectedTemplate.set(null);
    this.assignError.set(null);
    this.showAssignModal.set(true);

    if (this.templates().length === 0) {
      this.templatesLoading.set(true);
      this.templateSvc.getAll().subscribe({
        next: (t) => {
          this.templates.set(t);
          this.templatesLoading.set(false);
        },
        error: () => this.templatesLoading.set(false),
      });
    }
  }

  selectTemplate(id: number): void {
    this.selectedTemplate.set(id);
  }

  confirmAssign(): void {
    const templateId = this.selectedTemplate();
    if (!templateId) return;

    this.isAssigning.set(true);
    this.assignError.set(null);

    this.assignSvc.assign({
      studentId:         this.studentId(),
      workoutTemplateId: templateId,
      startDate:         new Date().toISOString().split('T')[0],
    }).subscribe({
      next: () => {
        this.isAssigning.set(false);
        this.showAssignModal.set(false);
        this.loadStudent();
      },
      error: (err: any) => {
        this.isAssigning.set(false);
        this.assignError.set(
          err.status === 409
            ? 'El alumno ya tiene un plan activo.'
            : 'Error al asignar el plan.'
        );
      },
    });
  }

  // ── Helpers ───────────────────────────────────
  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  formatLogDate(iso: string): string {
    if (!iso) return '';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7)  return `Hace ${days} días`;
    return this.formatDate(iso);
  }
}
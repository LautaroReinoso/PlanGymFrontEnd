// ─────────────────────────────────────────────
//  GymPlan — StudentDetailPageComponent
//  Perfil del alumno + workout activo
//  + modal para asignar nuevo plan.
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { StudentService } from '../../../services/student.service';
import { TemplateService } from '../../../services/template.service';
import { AssignmentService } from '../../../services/assignment.service';
import {
  StudentSummary,
  StudentWorkout,
  WorkoutTemplateSummary,
} from '../../..//models/trainer.models';
import { ButtonComponent } from '../../../../..//shared/components/button-component/button-component.component';
import { SkeletonComponent } from '../../../../../shared/components/skeleton/skeleton.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { BadgeComponent } from '../../../../../shared/components/badge-component/badge.component';

@Component({
  selector: 'app-student-detail-page',
  standalone: true,
  imports: [
    CommonModule,
   // RouterLink,
    BadgeComponent,
    ButtonComponent,
    SkeletonComponent,
  ],
  templateUrl: './student-detail-page.component.html',
  styleUrl: './student-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetailPageComponent implements OnInit {

  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly studentSvc = inject(StudentService);
  private readonly templateSvc = inject(TemplateService);
  private readonly assignSvc  = inject(AssignmentService);

  // ── Estado ────────────────────────────────────
  readonly student    = signal<StudentSummary | null>(null);
  readonly isLoading  = signal(true);
  readonly error      = signal<string | null>(null);

  // Modal de asignación
  readonly showAssignModal  = signal(false);
  readonly templates        = signal<WorkoutTemplateSummary[]>([]);
  readonly selectedTemplate = signal<number | null>(null);
  readonly isAssigning      = signal(false);
  readonly assignError      = signal<string | null>(null);

  // ── Computed ──────────────────────────────────
  readonly initials = computed(() => {
    const s = this.student();
    if (!s) return '?';
    return (s.fullName ?? s.mail).charAt(0).toUpperCase();
  });

  readonly displayName = computed(() => {
    const s = this.student();
    if (!s) return '';
    return s.fullName ?? s.mail.split('@')[0];
  });

  readonly studentId = computed(() =>
    Number(this.route.snapshot.paramMap.get('id'))
  );

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.loadStudent();
  }

  loadStudent(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studentSvc.getStudentById(this.studentId()).subscribe({
      next: (data) => {
        this.student.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el alumno.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Modal asignar ─────────────────────────────
  openAssignModal(): void {
    this.selectedTemplate.set(null);
    this.assignError.set(null);
    this.showAssignModal.set(true);

    // Cargar templates si aún no los tenemos
    if (this.templates().length === 0) {
      this.templateSvc.getAll().subscribe({
        next: (t) => this.templates.set(t),
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
      studentId: this.studentId(),
      workoutTemplateId: templateId,
      startDate: new Date().toISOString().split('T')[0],
    }).subscribe({
      next: () => {
        this.isAssigning.set(false);
        this.showAssignModal.set(false);
        this.loadStudent();   // recargar con el nuevo workout
      },
      error: (err) => {
        this.isAssigning.set(false);
        this.assignError.set(
          err.status === 409
            ? 'El alumno ya tiene un plan activo.'
            : 'Error al asignar el plan.'
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/trainer/students']);
  }
}
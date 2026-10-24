// ─────────────────────────────────────────────
//  GymPlan — StudentsPageComponent
//  Lista de alumnos del trainer con skeleton
//  loader, estado vacío y búsqueda local.
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StudentService } from '../../../services/student.service';
import { StudentSummary } from '../../../models/trainer.models';
import { StudentCardComponent } from '../../../components/students/student-card/student-card.component';
import { SkeletonComponent } from '../../../../../shared/components/skeleton/skeleton.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { NewStudentModalComponent } from "../../../components/students/new-student-modal/new-student-modal.component";
import { CreateStudentRequest } from '../../../models/student.models';

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    StudentCardComponent,
    SkeletonComponent,
    ButtonComponent,
    NewStudentModalComponent
],
  templateUrl: './students-page.component.html',
  styleUrl: './students-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsPageComponent implements OnInit {

    private readonly studentService = inject(StudentService);

  // ── Estado ────────────────────────────────────
  readonly students   = signal<StudentSummary[]>([]);
  readonly isLoading  = signal(false);   // solo para carga inicial
  readonly isCreating = signal(false);   // solo para crear alumno
  readonly error      = signal<string | null>(null);
  readonly createError = signal<string | null>(null); // error específico del modal
  readonly searchTerm = signal('');
  readonly showCreateStudentModal = signal(false);

  readonly skeletons = Array(5).fill(0);

  // ── Computed ──────────────────────────────────
  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.students();

    return this.students().filter(s => {
      const fullName = s.fullName?.toLowerCase() ?? '';
      const dni      = s.dni?.toString()         ?? '';

      return dni.includes(term) || fullName.includes(term) || dni.includes(term);
    });
  });

  readonly activeCount = computed(() =>
    this.students().filter(s => s.activeWorkout !== null).length
  );

  // FIX: isEmpty solo mira students, no isLoading
  readonly isEmpty = computed(() => this.students().length === 0);

  readonly noResults = computed(() =>
    !this.isLoading() &&
    this.students().length > 0 &&
    this.filtered().length === 0
  );

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.loadStudents();
  }

  // ── Carga ─────────────────────────────────────
  loadStudents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studentService.getMyStudents().subscribe({
      next: (data) => {
        this.students.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los alumnos.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Búsqueda ──────────────────────────────────
  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  // ── Modal ─────────────────────────────────────
  openCreateModal(): void {
    this.createError.set(null); // limpiar error anterior
    this.showCreateStudentModal.set(true);
  }

  // ── Crear alumno ──────────────────────────────
  createStudent(request: CreateStudentRequest): void {
    this.isCreating.set(true);
    this.createError.set(null);

    this.studentService.createStudent(request).subscribe({
      next: () => {
    this.showCreateStudentModal.set(false);
      this.isCreating.set(false);
      // Recargar lista para obtener el alumno real del backend
      this.loadStudents();
      },
      error: () => {
        this.createError.set('No se pudo crear el alumno.');
        this.isCreating.set(false);
      },
    });
  }
}
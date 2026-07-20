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

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    StudentCardComponent,
    SkeletonComponent,
 //   ButtonComponent,
  ],
  templateUrl: './students-page.component.html',
  styleUrl: './students-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsPageComponent implements OnInit {

  private readonly studentService = inject(StudentService);

  // ── Estado ────────────────────────────────────
  readonly students   = signal<StudentSummary[]>([]);
  readonly isLoading  = signal(true);
  readonly error      = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly skeletons  = Array(5).fill(0);

  // ── Computed ──────────────────────────────────
  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.students();
    return this.students().filter(s =>
      s.mail.toLowerCase().includes(term) ||
      s.fullName?.toLowerCase().includes(term)
    );
  });

  readonly activeCount = computed(() =>
    this.students().filter(s => s.activeWorkout !== null).length
  );

  readonly isEmpty = computed(() =>
    !this.isLoading() && this.students().length === 0
  );

  readonly noResults = computed(() =>
    !this.isLoading() &&
    this.students().length > 0 &&
    this.filtered().length === 0
  );

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.loadStudents();
  }

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

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }
}
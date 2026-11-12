// ─────────────────────────────────────────────
//  GymPlan — StudentsPageComponent
//  Lista de alumnos del trainer con skeleton
//  loader, estado vacío y búsqueda local.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StudentService } from '../../../services/student.service';
import { StudentSummary } from '../../../models/trainer.models';
import { StudentCardComponent } from '../../../components/students/student-card/student-card.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { NewStudentModalComponent } from "../../../components/students/new-student-modal/new-student-modal.component";
import { CreateStudentRequest } from '../../../models/student.models';
import { PageLoaderComponent } from '../../../../../shared/components/page-loader/page-loader.component';
import { SubscriptionBannerComponent } from '../../../components/subscription/subscription-banner/subscription-banner.component';
import { BillingService, apiErrorMessage, isStudentLimitError } from '../../../services/billing.service';
import { EnrollStudentModalComponent } from '../../../../booking/components/enroll-modal/enroll-student-modal.component';
import { DAY_SHORT, hhmm, isoDateKey, isoTime, shortDate } from '../../../../booking/utils/booking-date.util';
import { BookingTrainerService } from '../../../../booking/services/booking-trainer.service';

import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [EmptyStateComponent, PageLoaderComponent, 
    CommonModule,
    RouterLink,
    FormsModule,
    StudentCardComponent,
    ButtonComponent,
    NewStudentModalComponent,
    SubscriptionBannerComponent,
    EnrollStudentModalComponent,
],
  templateUrl: './students-page.component.html',
  styleUrl: './students-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

    private readonly studentService = inject(StudentService);
  private readonly billing = inject(BillingService);
  private readonly booking = inject(BookingTrainerService);

  // ── Estado ────────────────────────────────────
  readonly students   = signal<StudentSummary[]>([]);
  readonly isLoading  = signal(false);   // solo para carga inicial
  readonly isCreating = signal(false);   // solo para crear alumno
  readonly error      = signal<string | null>(null);
  readonly createError = signal<string | null>(null);

  // ── Turnos: ofrecer horario fijo después del alta ──
  private readonly bookingEnabled = signal(false);
  readonly enrollDni = signal<string | null>(null); // error específico del modal
  readonly createErrorIsLimit = computed(() =>
    this.billing.enabled && isStudentLimitError(this.createError()),
  );
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
    this.booking.probe().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => {
      this.bookingEnabled.set(ok);
      if (ok) this.loadTurnos();
    });
    this.loadStudents();
  }

  // ── Turnos por alumno (GET /professional/students) ──
  readonly turnosText = signal<Map<number, string>>(new Map());

  private loadTurnos(): void {
    this.booking.students('', 'ALL').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        const m = new Map<number, string>();
        for (const s of list) {
          const parts: string[] = [];
          if (s.nextBookingAt) parts.push(`Próxima clase: ${shortDate(isoDateKey(s.nextBookingAt))} ${isoTime(s.nextBookingAt)}`);
          else if (s.activeEnrollments?.length) parts.push('Sin clases próximas');
          const fixed = (s.activeEnrollments ?? []).map(e => `${DAY_SHORT[e.dayOfWeek]} ${hhmm(e.startTime)}`);
          if (fixed.length) parts.push(fixed.join(' · '));
          if (parts.length) m.set(s.userId, parts.join(' — '));
        }
        this.turnosText.set(m);
      },
      error: () => {},
    });
  }

  // ── Carga ─────────────────────────────────────
  loadStudents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studentService.getMyStudents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    this.studentService.createStudent(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
    this.showCreateStudentModal.set(false);
      if (this.bookingEnabled()) this.enrollDni.set(request.dni);
      this.isCreating.set(false);
      // Recargar lista para obtener el alumno real del backend
      this.loadStudents();
      },
      error: err => {
        // 400 de negocio (DNI repetido/inválido, límite del plan) trae `message`
        this.createError.set(apiErrorMessage(err, 'No se pudo crear el alumno.'));
        this.isCreating.set(false);
      },
    });
  }
}
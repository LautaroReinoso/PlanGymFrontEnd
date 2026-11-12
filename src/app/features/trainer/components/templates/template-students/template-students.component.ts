// ─────────────────────────────────────────────
//  PlanGym — TemplateStudentsComponent
//  En el detalle de una plantilla: quién la tiene asignada, "Asignar" y "Quitar".
//  El listado de alumnos solo trae el nombre del plan activo; para confirmar que es ESTA plantilla
//  (y obtener el id de la asignación) se consulta /student-workouts/student/{id} de los candidatos.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';

import { ENVIRONMENT } from '../../../../../../environments/tokens/environment.token';
import { StudentService } from '../../../services/student.service';
import { AssignmentService } from '../../../services/assignment.service';
import { StudentSummary } from '../../../models/trainer.models';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button-component/button-component.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../../core/http/api-error.util';
import { todayKey } from '../../../../booking/utils/booking-date.util';

interface ActiveAssignment { id: number; active?: boolean; activeWorkout?: { workoutTemplateId?: number; startDate?: string } | null; }
interface Assigned { student: StudentSummary; assignmentId: number; startDate: string | null; }

@Component({
  selector: 'app-template-students',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent, ButtonComponent],
  templateUrl: './template-students.component.html',
  styleUrl: './template-students.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateStudentsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  private readonly students = inject(StudentService);
  private readonly assignSvc = inject(AssignmentService);
  private readonly toast = inject(ToastService);

  readonly templateId   = input.required<number>();
  readonly templateName = input.required<string>();

  /** Cantidad de alumnos con este plan (se emite después de cada carga). La página lo usa para no dejar eliminar. */
  readonly countChange = output<string[]>();

  readonly all       = signal<StudentSummary[]>([]);
  readonly assigned  = signal<Assigned[]>([]);
  readonly isLoading = signal(true);

  // Asignar
  readonly showAssign = signal(false);
  readonly search     = signal('');
  readonly pickedId   = signal<number | null>(null);
  readonly isSaving   = signal(false);
  readonly error      = signal<string | null>(null);
  // Quitar
  readonly removeTarget = signal<Assigned | null>(null);

  private readonly assignedIds = computed(() => new Set(this.assigned().map(a => a.student.id)));
  readonly candidates = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.all()
      .filter(s => !this.assignedIds().has(s.id))
      .filter(s => !q || this.nameOf(s).toLowerCase().includes(q) || (s.dni ?? '').includes(q))
      .sort((a, b) => this.nameOf(a).localeCompare(this.nameOf(b)));
  });
  readonly picked = computed(() => this.all().find(s => s.id === this.pickedId()) ?? null);

  constructor() {
    effect(() => {
      const id = this.templateId(), name = this.templateName();
      untracked(() => this.load(id, name));
    });
  }

  nameOf(s: StudentSummary): string {
    return s.fullName?.trim() || (s.dni ? `DNI ${s.dni}` : 'Sin nombre');
  }

  load(id = this.templateId(), name = this.templateName()): void {
    this.isLoading.set(true);
    this.students.getMyStudents().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        this.all.set(list);
        // Candidatos: plan activo con el mismo nombre. Se confirma por id de plantilla.
        const cands = list.filter(s => s.activeWorkout?.templateName === name);
        if (!cands.length) { this.assigned.set([]); this.isLoading.set(false); this.countChange.emit([]); return; }
        forkJoin(cands.map(s =>
          this.http.get<ActiveAssignment>(`${this.api}/student-workouts/student/${s.id}`).pipe(
            map(w => (w && w.activeWorkout?.workoutTemplateId === id)
              ? { student: s, assignmentId: w.id, startDate: w.activeWorkout?.startDate ?? s.activeWorkout?.startDate ?? null } as Assigned
              : null),
            catchError(() => of(null)),
          ))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
            this.assigned.set(res.filter((a): a is Assigned => !!a)
              .sort((a, b) => this.nameOf(a.student).localeCompare(this.nameOf(b.student))));
            this.isLoading.set(false);
            this.countChange.emit(this.assigned().map(a => this.nameOf(a.student)));
          });
      },
      error: err => { this.isLoading.set(false); this.toast.error(apiErrorText(err, 'No se pudieron cargar los alumnos.')); },
    });
  }

  openAssign(): void {
    this.search.set(''); this.pickedId.set(null); this.error.set(null);
    this.showAssign.set(true);
  }

  confirmAssign(): void {
    const s = this.picked();
    if (!s) return;
    this.isSaving.set(true);
    this.error.set(null);
    this.assignSvc.assign({ studentId: s.id, workoutTemplateId: this.templateId(), startDate: todayKey() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showAssign.set(false);
          this.toast.success(`${this.nameOf(s)} ahora tiene "${this.templateName()}".`);
          this.load();
        },
        error: err => { this.isSaving.set(false); this.error.set(apiErrorText(err, 'No se pudo asignar el plan.')); },
      });
  }

  confirmRemove(): void {
    const a = this.removeTarget();
    if (!a) return;
    this.isSaving.set(true);
    this.assignSvc.unassign(a.assignmentId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.removeTarget.set(null);
        this.toast.success(`Le quitaste el plan a ${this.nameOf(a.student)}.`);
        this.load();
      },
      error: err => { this.isSaving.set(false); this.toast.error(apiErrorText(err, 'No se pudo quitar el plan.')); },
    });
  }

  ddmmyyyy(iso: string | null): string {
    if (!iso) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
}

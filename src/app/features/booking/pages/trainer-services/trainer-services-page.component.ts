// ─────────────────────────────────────────────
//  PlanGym — TrainerServicesPage (/trainer/turnos/servicios)
//  Mis servicios (sin precio). Eliminar = soft delete en el backend
//  (active = false): se muestran aparte con "Reactivar".
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingTrainerService } from '../../services/booking-trainer.service';
import { BookingMode, BookingService, BookingServiceRequest } from '../../models/booking.models';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const MODE_TEXT: Record<BookingMode, string> = {
  ENROLLMENT: 'Horario fijo', SELF: 'Clase suelta', BOTH: 'Horario fijo y clase suelta',
};

const EMPTY_SERVICE: BookingServiceRequest = {
  name: '', description: '', durationMinutes: 60, bookingMode: 'ENROLLMENT',
  selfEnrollment: false, weeklyLimit: 2, monthlyLimit: null, price: 0,
};

@Component({
  selector: 'app-trainer-services-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './trainer-services-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerServicesPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(BookingTrainerService);
  private readonly toast = inject(ToastService);

  readonly modeText = MODE_TEXT;

  readonly services  = signal<BookingService[]>([]);
  readonly isLoading = signal(false);
  readonly busyId    = signal<number | null>(null);

  readonly activeServices   = computed(() => this.services().filter(s => s.active !== false));
  readonly inactiveServices = computed(() => this.services().filter(s => s.active === false));

  readonly editingService  = signal<BookingService | null>(null);
  readonly serviceForm     = signal<BookingServiceRequest | null>(null);
  readonly serviceError    = signal<string | null>(null);
  readonly isSavingService = signal(false);
  readonly deleteTarget    = signal<BookingService | null>(null);

  readonly allowsEnrollment = computed(() => {
    const f = this.serviceForm();
    return !!f && (f.bookingMode === 'ENROLLMENT' || f.bookingMode === 'BOTH');
  });

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.api.allServices().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => { this.services.set(list); this.isLoading.set(false); },
      error: err => { this.isLoading.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  private reload(): void {
    this.api.allServices().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => this.services.set(list),
      error: err => this.toast.error(apiErrorText(err)),
    });
  }

  private toRequest(s: BookingService, active?: boolean): BookingServiceRequest {
    return {
      name: s.name, description: s.description ?? '', durationMinutes: s.durationMinutes,
      bookingMode: s.bookingMode, selfEnrollment: !!s.selfEnrollment, weeklyLimit: s.weeklyLimit ?? 2,
      monthlyLimit: s.monthlyLimit ?? null,
      price: 0, active: active ?? s.active, modality: 'IN_PERSON',
    };
  }

  newService(): void {
    this.editingService.set(null);
    this.serviceForm.set({ ...EMPTY_SERVICE });
    this.serviceError.set(null);
  }

  editService(s: BookingService): void {
    this.editingService.set(s);
    this.serviceForm.set(this.toRequest(s));
    this.serviceError.set(null);
  }

  patchForm(patch: Partial<BookingServiceRequest>): void {
    this.serviceForm.update(f => f ? { ...f, ...patch } : f);
  }

  saveService(): void {
    const f = this.serviceForm();
    if (!f || !f.name.trim() || !f.durationMinutes) return;
    const body: BookingServiceRequest = {
      ...f,
      name: f.name.trim(),
      price: 0,
      selfEnrollment: this.allowsEnrollment() ? !!f.selfEnrollment : false,
      weeklyLimit: this.allowsEnrollment() ? f.weeklyLimit : null,
      // El tope mensual se calcula solo (veces por semana × 4): no se carga a mano
      monthlyLimit: null,
      modality: 'IN_PERSON',
    };
    const editing = this.editingService();
    this.isSavingService.set(true);
    (editing ? this.api.updateService(editing.id, body) : this.api.createService(body)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSavingService.set(false);
        this.serviceForm.set(null);
        this.toast.success('Servicio guardado.');
        this.reload();
      },
      error: err => { this.isSavingService.set(false); this.serviceError.set(apiErrorText(err)); },
    });
  }

  confirmDeleteService(): void {
    const s = this.deleteTarget();
    if (!s) return;
    this.isSavingService.set(true);
    this.api.deleteService(s.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSavingService.set(false);
        this.deleteTarget.set(null);
        // Soft delete: lo pasamos a "Eliminados" ya, sin esperar la recarga.
        this.services.update(list => list.map(x => x.id === s.id ? { ...x, active: false } : x));
        this.toast.success('Servicio eliminado.');
        this.reload();
      },
      error: err => { this.isSavingService.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  reactivate(s: BookingService): void {
    this.busyId.set(s.id);
    this.api.updateService(s.id, this.toRequest(s, true)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busyId.set(null); this.toast.success('Servicio activado.'); this.reload(); },
      error: err => { this.busyId.set(null); this.toast.error(apiErrorText(err)); },
    });
  }
}

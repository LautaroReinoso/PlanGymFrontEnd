// ─────────────────────────────────────────────
//  PlanGym — AdminTrainersPageComponent
//  Lista de entrenadores para el GLOBAL_ADMIN: buscar, ver estado
//  y habilitar / deshabilitar (no borra datos).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { apiErrorText } from '../../../core/http/api-error.util';
import { AdminService, AdminTrainer } from '../services/admin.service';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';

type StatusFilter = 'ALL' | 'ENABLED' | 'DISABLED';

@Component({
  selector: 'app-admin-trainers-page',
  standalone: true,
  imports: [FormsModule, DatePipe, PageLoaderComponent],
  templateUrl: './admin-trainers-page.component.html',
  styleUrl: './admin-trainers-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTrainersPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminService = inject(AdminService);

  readonly trainers  = signal<AdminTrainer[]>([]);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly pendingId = signal<number | null>(null);
  /** userIds de entrenadores que todavía no están dados de alta en turnos */
  readonly notInBooking = signal<Set<number>>(new Set());

  readonly search = signal('');
  readonly status = signal<StatusFilter>('ALL');

  readonly enabledCount  = computed(() => this.trainers().filter(t => t.enabled).length);
  readonly disabledCount = computed(() => this.trainers().length - this.enabledCount());

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const st = this.status();
    return this.trainers().filter(t => {
      if (st === 'ENABLED' && !t.enabled) return false;
      if (st === 'DISABLED' && t.enabled) return false;
      if (!term) return true;
      return [this.fullName(t), t.mail].join(' ').toLowerCase().includes(term);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  loadCandidates(): void {
    this.adminService.bookingCandidates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => this.notInBooking.set(new Set(list.map(c => c.userId))),
      error: () => this.notInBooking.set(new Set()),   // módulo apagado o sin permiso: no se ofrece
    });
  }

  toggleSubscription(t: AdminTrainer): void {
    const next = !t.subscriptionActive;
    const msg = next
      ? `¿Activar a mano la suscripción de ${this.fullName(t)}? (prueba, cortesía o pago por fuera)`
      : `¿Desactivar la suscripción de ${this.fullName(t)}? Sus alumnos pueden dejar de entrar.`;
    if (!confirm(msg)) return;
    this.pendingId.set(t.id);
    this.error.set(null);
    this.adminService.setSubscription(t.id, next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: u => {
        this.trainers.update(list => list.map(x => x.id === t.id ? { ...x, subscriptionActive: u?.subscriptionActive ?? next } : x));
        this.pendingId.set(null);
      },
      error: err => { this.error.set(apiErrorText(err, 'No se pudo cambiar la suscripción.')); this.pendingId.set(null); },
    });
  }

  addToBooking(t: AdminTrainer): void {
    this.pendingId.set(t.id);
    this.error.set(null);
    this.adminService.addProfessional(t.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notInBooking.update(s => { const n = new Set(s); n.delete(t.id); return n; });
        this.pendingId.set(null);
      },
      error: err => { this.error.set(apiErrorText(err, 'No se pudo dar de alta en turnos.')); this.pendingId.set(null); },
    });
  }

  load(): void {
    this.loadCandidates();
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getTrainers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => { this.trainers.set(list); this.isLoading.set(false); },
      error: () => {
        this.error.set('No pudimos cargar los entrenadores.');
        this.isLoading.set(false);
      },
    });
  }

  fullName(t: AdminTrainer): string {
    const n = [t.nombre, t.apellido].filter(Boolean).join(' ').trim();
    return n || 'Sin nombre cargado';
  }

  initials(t: AdminTrainer): string {
    const src = [t.nombre, t.apellido].filter(Boolean).join(' ').trim() || t.mail;
    return src.split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  toggle(t: AdminTrainer): void {
    const next = !t.enabled;
    const msg = next
      ? `¿Habilitar a ${this.fullName(t)}? Va a poder volver a ingresar.`
      : `¿Deshabilitar a ${this.fullName(t)}? No va a poder ingresar y su sesión se corta. Sus datos y los de sus alumnos se conservan.`;
    if (!confirm(msg)) return;

    this.pendingId.set(t.id);
    this.error.set(null);
    this.adminService.setTrainerEnabled(t.id, next).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => {
        this.trainers.update(list => list.map(x => (x.id === updated.id ? updated : x)));
        this.pendingId.set(null);
      },
      error: () => {
        this.error.set('No se pudo cambiar el estado del entrenador.');
        this.pendingId.set(null);
      },
    });
  }
}

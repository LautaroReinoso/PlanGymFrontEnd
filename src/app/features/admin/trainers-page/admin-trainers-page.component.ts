// ─────────────────────────────────────────────
//  PlanGym — AdminTrainersPageComponent
//  Lista de entrenadores para el GLOBAL_ADMIN: buscar, ver estado
//  y habilitar / deshabilitar (no borra datos).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

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
  private readonly adminService = inject(AdminService);

  readonly trainers  = signal<AdminTrainer[]>([]);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);
  readonly pendingId = signal<number | null>(null);

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

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getTrainers().subscribe({
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
    this.adminService.setTrainerEnabled(t.id, next).subscribe({
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

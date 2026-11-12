// ─────────────────────────────────────────────
//  PlanGym — app-trainer-bottom-nav (solo celular, ≤768px)
//  Hoy · Alumnos · Turnos · Plantillas · Ejercicios
//  (Hoy y Turnos solo si el módulo de turnos responde).
//  Perfil, Suscripción y Cerrar sesión siguen en el menú (☰).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BookingTrainerService } from '../../../../booking/services/booking-trainer.service';

interface Item { label: string; path: string; icon: string; booking?: boolean; }

const ITEMS: Item[] = [
  { label: 'Hoy', path: '/trainer/hoy', booking: true, icon: 'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  { label: 'Alumnos', path: '/trainer/students', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { label: 'Turnos', path: '/trainer/turnos', booking: true, icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { label: 'Plantillas', path: '/trainer/templates', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  { label: 'Ejercicios', path: '/trainer/exercises', icon: 'M6 18h2M16 18h2M4 14h16M4 10h16M6 6h2M16 6h2M8 6v12M18 6v12' },
];

@Component({
  selector: 'app-trainer-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tbn" aria-label="Navegación">
      @for (it of items(); track it.path) {
        <a class="tbn__item" [routerLink]="it.path" routerLinkActive="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path [attr.d]="it.icon" />
          </svg>
          <span>{{ it.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    :host { display: none; }
    @media (max-width: 768px) {
      :host { display: block; position: fixed; left: 0; right: 0; bottom: 0; z-index: 35; }
    }
    .tbn {
      display: flex; justify-content: space-around;
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
      background: var(--color-surface); border-top: 1px solid var(--color-border);
    }
    .tbn__item {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 4px 0;
      font: 500 11px var(--font-body); color: var(--color-muted); text-decoration: none;
    }
    .tbn__item svg { width: 22px; height: 22px; }
    .tbn__item.active { color: var(--color-accent); }
  `],
})
export class TrainerBottomNavComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly enabled = signal(false);
  readonly items = computed(() => ITEMS.filter(i => !i.booking || this.enabled()));

  constructor() {
    inject(BookingTrainerService).probe().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(ok => this.enabled.set(ok));
  }
}

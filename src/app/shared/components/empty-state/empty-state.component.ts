// ─────────────────────────────────────────────
//  PlanGym — app-empty-state (shared)
//  Estado vacío estándar: ícono + título + subtítulo + acciones.
//  <app-empty-state title="…" subtitle="…">
//    <svg empty-icon …/>                 ← ícono (24–32 px, trazo)
//    <gp-button empty-actions …/>        ← opcional
//  </app-empty-state>
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="es" role="status">
      <div class="es__icon" aria-hidden="true"><ng-content select="[empty-icon]" /></div>
      <h3 class="es__title">{{ title() }}</h3>
      @if (subtitle()) { <p class="es__sub">{{ subtitle() }}</p> }
      <div class="es__actions"><ng-content select="[empty-actions]" /></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .es {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      padding: var(--space-12) var(--space-6); text-align: center;
    }
    .es__icon {
      width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center;
      background: var(--color-card); border: 1px solid var(--color-border); color: var(--color-muted-light);
    }
    .es__title { margin: 0; font: 700 var(--text-lg)/var(--leading-lg) var(--font-display); color: var(--color-text); }
    .es__sub { margin: 0; max-width: 300px; font-size: var(--text-sm); line-height: var(--leading-sm); color: var(--color-muted-light); }
    .es__actions:empty { display: none; }
    .es__actions { margin-top: var(--space-2); display: flex; gap: var(--space-2); flex-wrap: wrap; justify-content: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title    = input.required<string>();
  readonly subtitle = input<string | null>(null);
}

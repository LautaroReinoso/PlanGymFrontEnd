// ─────────────────────────────────────────────
//  PlanGym — PageLoaderComponent (shared)
//  Estado de carga estándar de la app: el gym-loader
//  (persona levantando la barra) centrado + texto opcional.
//  Uso:  @if (isLoading()) { <app-page-loader message="Cargando tu semana…" /> }
//        <app-page-loader [size]="36" [compact]="true" />   ← dentro de modales/tarjetas
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GymLoaderComponent } from '../gym-loader/gym-loader.component';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [GymLoaderComponent],
  template: `
    <div class="page-loader" [class.page-loader--compact]="compact()" role="status" aria-live="polite">
      <app-gym-loader [size]="size()" />
      @if (message()) {
        <p class="page-loader__text">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-loader {
      min-height: 40vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      animation: fadeIn 200ms ease both;
    }
    .page-loader--compact { min-height: 120px; }
    .page-loader__text {
      margin: 0;
      font-size: 14px;
      color: var(--color-muted-light);
      text-align: center;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLoaderComponent {
  readonly size    = input<number>(56);
  readonly message = input<string | null>(null);
  readonly compact = input<boolean>(false);
}

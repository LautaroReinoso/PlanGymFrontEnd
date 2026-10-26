import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="admin-shell">
      <header class="admin-top">
        <div class="admin-brand">
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <rect width="36" height="36" rx="10" fill="var(--color-accent)"/>
            <rect x="6"  y="15" width="6"  height="6" rx="2" fill="white"/>
            <rect x="24" y="15" width="6"  height="6" rx="2" fill="white"/>
            <rect x="11" y="17" width="14" height="2" rx="1" fill="white"/>
          </svg>
          <span>PlanGym</span>
          <span class="admin-tag">Admin</span>
        </div>
        <div class="admin-user">
          <span class="admin-mail">{{ mail() }}</span>
          <button type="button" class="admin-logout" (click)="logout()" title="Cerrar sesión" aria-label="Cerrar sesión">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>
      <main class="admin-content"><router-outlet /></main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--color-bg); }
    .admin-top {
      position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px 20px; background: var(--color-surface); border-bottom: 1px solid var(--color-border);
    }
    .admin-brand { display: flex; align-items: center; gap: 8px; font: 700 16px var(--font-display); color: var(--color-text); }
    .admin-tag {
      font: 600 11px var(--font-body); text-transform: uppercase; letter-spacing: .6px;
      padding: 3px 8px; border-radius: 999px; background: var(--color-accent-dim); color: var(--color-accent);
    }
    .admin-user { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .admin-mail { font-size: 13px; color: var(--color-muted-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .admin-logout {
      width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 8px;
      background: none; color: var(--color-muted-light); cursor: pointer; flex-shrink: 0;
    }
    .admin-logout:hover { background: rgba(239, 68, 68, .08); color: var(--color-danger); }
    .admin-content { max-width: 1000px; margin: 0 auto; padding: 28px 20px 48px; }
    @media (max-width: 560px) { .admin-mail { display: none; } .admin-content { padding: 20px 16px 40px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  readonly mail = this.auth.currentMail;
  logout(): void { this.auth.logout(); }
}

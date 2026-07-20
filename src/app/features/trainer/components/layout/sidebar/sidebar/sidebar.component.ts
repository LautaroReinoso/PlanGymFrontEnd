// ─────────────────────────────────────────────
//  GymPlan — SidebarComponent
//  Navegación principal del trainer.
//  Desktop: fijo. Mobile: drawer desde la izquierda.
// ─────────────────────────────────────────────

import {
  Component,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {

  private readonly auth = inject(AuthService);

  readonly isOpen       = input<boolean>(false);
  readonly closeRequest = output<void>();

  readonly navItems: NavItem[] = [
    {
      label: 'Alumnos',
      route: '/trainer/students',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    },
    {
      label: 'Plantillas',
      route: '/trainer/templates',
      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M12 12h4M12 16h4M8 12h.01M8 16h.01',
    },
    {
      label: 'Ejercicios',
      route: '/trainer/exercises',
      icon: 'M6 18h2M16 18h2M4 14h16M4 10h16M6 6h2M16 6h2M8 6v12M18 6v12',
    },
  ];

  readonly userMail = this.auth.currentMail;

  get userInitials(): string {
    const mail = this.auth.currentMail();
    if (!mail) return '?';
    return mail.charAt(0).toUpperCase();
  }

  onClose(): void {
    this.closeRequest.emit();
  }

  onLogout(): void {
    this.auth.logout();
  }
}
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StudentClassesService } from '../../../../booking/services/student-classes.service';

interface NavItem {
  label: string;
  path: string;
  icon: 'home' | 'today' | 'week' | 'month' | 'profile' | 'turnos';
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  private readonly classes = inject(StudentClassesService);

  constructor() { this.classes.init(); }

  /**
   * 5.ª pestaña: "Turnos" si el módulo está prendido; si no, "Perfil".
   * El Perfil siempre está además en el avatar del header del Inicio.
   */
  readonly items = computed<NavItem[]>(() => [
    { label: 'Inicio', path: '/student/dashboard', icon: 'home' },
    { label: 'Hoy',    path: '/student/daily',     icon: 'today' },
    { label: 'Semana', path: '/student/weekly',    icon: 'week' },
    { label: 'Mes',    path: '/student/monthly',   icon: 'month' },
    this.classes.enabled()
      ? { label: 'Turnos', path: '/student/turnos',  icon: 'turnos' }
      : { label: 'Perfil', path: '/student/profile', icon: 'profile' },
  ]);
}

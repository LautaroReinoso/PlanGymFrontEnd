import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: 'home' | 'today' | 'week' | 'month';
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
  readonly items: NavItem[] = [
    { label: 'Inicio', path: '/student/dashboard', icon: 'home' },
    { label: 'Hoy',    path: '/student/daily',     icon: 'today' },
    { label: 'Semana', path: '/student/weekly',    icon: 'week' },
    { label: 'Mes',    path: '/student/monthly',   icon: 'month' },
  ];
}

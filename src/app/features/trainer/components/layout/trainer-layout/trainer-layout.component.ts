// ─────────────────────────────────────────────
//  GymPlan — TrainerLayoutComponent
//  Shell principal del trainer.
//  Sidebar colapsable + router-outlet.
// ─────────────────────────────────────────────

import {
  Component,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar/sidebar.component';

@Component({
  selector: 'app-trainer-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './trainer-layout.component.html',
  styleUrl: './trainer-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerLayoutComponent {

readonly sidebarOpen = signal(false);
 
  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
 
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
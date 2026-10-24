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
import { IconButtonComponent } from '../../../../../shared/components/icon-button/icon-button.component';
@Component({
  selector: 'app-trainer-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, IconButtonComponent],
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
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLayoutComponent {}

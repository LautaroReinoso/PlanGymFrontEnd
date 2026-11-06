import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CancelNoticeComponent } from '../../../../booking/components/cancel-notice/cancel-notice.component';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, CancelNoticeComponent],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLayoutComponent {}

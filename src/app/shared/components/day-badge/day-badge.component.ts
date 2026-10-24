import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-day-badge',
    standalone: true,
  imports: [],
  templateUrl: './day-badge.component.html',
  styleUrl: './day-badge.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayBadgeComponent {
readonly name = input.required<string>();
  readonly index = input.required<number>();
  readonly exerciseCount = input.required<number>();
  readonly isActive = input<boolean>(false);

  // ── Outputs ──
  readonly badgeClick = output<void>();

  onClick(): void {
    this.badgeClick.emit();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type BadgeVariant =
  | 'default'
  | 'elevated'
  | 'flat'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'gp-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {

  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('md');
  readonly dot = input(false);

  readonly classes = computed(() =>
    [
      'badge',
      `badge--${this.variant()}`,
      `badge--${this.size()}`
    ].join(' ')
  );
}
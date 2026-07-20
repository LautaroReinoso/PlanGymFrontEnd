// ─────────────────────────────────────────────
//  GymPlan — SkeletonComponent
//  Placeholder shimmer mientras carga la API.
//  Formas: line | circle | rect | card
// ─────────────────────────────────────────────

import { CommonModule } from '@angular/common';
import {
  Component,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';

export type SkeletonShape = 'line' | 'circle' | 'rect' | 'card';

@Component({
  selector: 'gp-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {

  readonly shape  = input<SkeletonShape>('line');
  readonly width  = input<string>('100%');
  readonly height = input<string>('');     // vacío = usa default del shape
  readonly radius = input<string>('');     // vacío = usa default del shape

  get styles(): Record<string, string> {
    const styles: Record<string, string> = {
      width: this.width(),
    };

    if (this.height()) styles['height'] = this.height();
    if (this.radius()) styles['border-radius'] = this.radius();

    return styles;
  }

  get hostClass(): string {
    return `skeleton skeleton--${this.shape()}`;
  }
}
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gym-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gym-loader.component.html',
  styleUrl: './gym-loader.component.css',
})
export class GymLoaderComponent {
  /** Tamaño del loader en píxeles (ancho = alto). */
  size = input<number>(48);

  /** Estilo inline aplicado al <svg>, calculado a partir de `size`. */
  protected readonly svgStyle = computed(() => ({
    width: `${this.size()}px`,
    height: `${this.size()}px`,
  }));
}
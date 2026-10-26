// ─────────────────────────────────────────────
//  PlanGym — MuscleIconComponent (gp-muscle-icon)
//  Silueta anatómica (frente/espalda) con el músculo principal
//  en azul y los secundarios en azul suave.
//
//  Modos:
//   - 'zoom'   (default) ícono chico para listas: encuadra torso o
//              piernas en la vista donde está el músculo. Cuadrado.
//   - 'single' cuerpo entero, solo la vista del músculo.
//   - 'both'   frente y espalda lado a lado (detalle de ejercicio).
//
//  <gp-muscle-icon [muscleGroup]="ex.primaryMuscle" />
//  <gp-muscle-icon [muscleGroup]="d.primaryMuscle" [secondary]="d.secondaryMuscles" mode="both" [size]="240" />
//  `size` = ancho en px (el alto se calcula según el modo).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MuscleGroup } from '../../../features/trainer/models/trainer.models';
import { muscleGroupLabel } from '../../../features/trainer/models/muscle-group.util';
import {
  BACK_MUSCLES,
  BACK_NEUTRAL,
  BACK_REGIONS,
  BodyView,
  FRONT_NEUTRAL,
  FRONT_REGIONS,
  LOWER_MUSCLES,
  SILHOUETTE_HALF,
  VIEWBOX_FULL,
  VIEWBOX_LOWER,
  VIEWBOX_UPPER,
} from './muscle-body.paths';

export type MuscleIconMode = 'zoom' | 'single' | 'both';

interface RegionPath { d: string; cls: string; }
interface ViewLayer { view: BodyView; dx: number; neutral: string[]; regions: RegionPath[]; }

/** Separación horizontal entre la figura de frente y la de espalda en modo "both" */
const BOTH_GAP = 110;

@Component({
  selector: 'gp-muscle-icon',
  standalone: true,
  templateUrl: './muscle-icon.component.html',
  styleUrl: './muscle-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuscleIconComponent {
  readonly muscleGroup = input.required<MuscleGroup>();
  readonly secondary   = input<readonly MuscleGroup[] | null | undefined>([]);
  readonly mode        = input<MuscleIconMode>('zoom');
  /** Ancho en px */
  readonly size        = input<number>(24);

  readonly silhouette = SILHOUETTE_HALF;
  readonly mirror = 'translate(100,0) scale(-1,1)';

  private readonly primaryView = computed<BodyView>(() =>
    BACK_MUSCLES.has(this.muscleGroup()) ? 'back' : 'front');

  readonly layers = computed<ViewLayer[]>(() => {
    const views: BodyView[] = this.mode() === 'both' ? ['front', 'back'] : [this.primaryView()];
    return views.map((view, i) => ({
      view,
      dx: i * BOTH_GAP,
      neutral: view === 'front' ? FRONT_NEUTRAL : BACK_NEUTRAL,
      regions: this.regionsFor(view),
    }));
  });

  private readonly box = computed(() => {
    const mg = this.muscleGroup();
    if (this.mode() === 'both') return { ...VIEWBOX_FULL, w: VIEWBOX_FULL.w + BOTH_GAP };
    if (this.mode() === 'single' || mg === 'FULL_BODY') return VIEWBOX_FULL;
    return LOWER_MUSCLES.has(mg) ? VIEWBOX_LOWER : VIEWBOX_UPPER;
  });

  readonly viewBox = computed(() => {
    const b = this.box();
    return `${b.x} ${b.y} ${b.w} ${b.h}`;
  });

  readonly width  = computed(() => this.size());
  readonly height = computed(() => {
    const b = this.box();
    return Math.round((this.size() * b.h) / b.w * 100) / 100;
  });

  readonly label = computed(() => {
    const sec = (this.secondary() ?? []).filter(m => m !== this.muscleGroup());
    const main = muscleGroupLabel(this.muscleGroup());
    return sec.length ? `${main} (también ${sec.map(m => muscleGroupLabel(m)).join(', ')})` : main;
  });

  private regionsFor(view: BodyView): RegionPath[] {
    const map = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;
    const primary = this.muscleGroup();
    const sec = new Set(this.secondary() ?? []);
    const out: RegionPath[] = [];
    for (const [key, paths] of Object.entries(map) as [MuscleGroup, string[]][]) {
      const cls = primary === 'FULL_BODY' || key === primary ? 'm on' : sec.has(key) ? 'm sec' : 'm';
      for (const d of paths) out.push({ d, cls });
    }
    return out;
  }
}

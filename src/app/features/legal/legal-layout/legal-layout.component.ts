// ─────────────────────────────────────────────
//  PlanGym — LegalLayoutComponent
//  Marco común de Privacidad y Términos: marca, título, fecha,
//  índice y navegación entre ambos documentos. Público (sin login).
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { LEGAL } from '../legal.config';

export interface LegalSection { id: string; title: string; }

@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './legal-layout.component.html',
  styleUrl: './legal-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalLayoutComponent {
  private readonly location = inject(Location);

  readonly title    = input.required<string>();
  readonly sections = input<LegalSection[]>([]);
  readonly legal = LEGAL;

  back(): void {
    if (window.history.length > 1) this.location.back();
    else window.location.href = '/login';
  }

  scrollTo(id: string, ev: Event): void {
    ev.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

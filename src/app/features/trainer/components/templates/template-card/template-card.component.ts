// ─────────────────────────────────────────────
//  GymPlan — TemplateCardComponent
//  Tarjeta simple: nombre + días.
//  Sin badges, sin métricas — limpia a propósito.
// ─────────────────────────────────────────────

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkoutTemplateSummary } from '../../../models/trainer.models';
import { BadgeComponent } from "../../../../../shared/components/badge-component/badge.component";

@Component({
  selector: 'app-template-card',
  standalone: true,
  imports: [CommonModule, 
  //  BadgeComponent
  ],
  templateUrl: './template-card.component.html',
  styleUrl: './template-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent {

  readonly template  = input.required<WorkoutTemplateSummary>();
  readonly cardClick = output<void>();

  ngOnInit(): void {
    console.log(this.template());
  }
  onClick(): void {
    this.cardClick.emit();
  }
  accent(): void{
    console.log('accent');
  }
}
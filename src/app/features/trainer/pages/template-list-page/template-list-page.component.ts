// ─────────────────────────────────────────────
//  GymPlan — TemplatesListPageComponent
//  Lista simple de plantillas del trainer.
//  Crear plantilla navega a /trainer/templates/new
//  (página dedicada, no modal).
// ─────────────────────────────────────────────

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TemplateService } from '../../services/template.service';
import { WorkoutTemplateSummary } from '../../models/trainer.models';

import { TemplateCardComponent } from '../../components/templates/template-card/template-card.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { GymLoaderComponent } from '../../../../shared/components/gym-loader/gym-loader.component';

@Component({
  selector: 'app-templates-list-page',
  standalone: true,
  imports: [
    CommonModule,
    TemplateCardComponent,
    ButtonComponent,
    GymLoaderComponent
  ],
  templateUrl: './template-list-page.component.html',
  styleUrl: './template-list-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesListPageComponent implements OnInit {

  private readonly templateSvc = inject(TemplateService);
  private readonly router      = inject(Router);

  // ── Estado ────────────────────────────────────
  readonly templates  = signal<WorkoutTemplateSummary[]>([]);
  readonly isLoading  = signal(true);
  readonly error      = signal<string | null>(null);

  readonly skeletons  = Array(4).fill(0);

  // ── Computed ──────────────────────────────────
  readonly isEmpty = computed(() =>
    !this.isLoading() && this.templates().length === 0
  );

  // ── Lifecycle ─────────────────────────────────
  ngOnInit(): void {
    this.loadTemplates();
    console.log(this.templates());
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.templateSvc.getAll().subscribe({
      next: (data) => {
        this.templates.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las plantillas.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Navegación ────────────────────────────────
  openTemplate(id: number): void {
    this.router.navigate(['/trainer/templates', id]);
  }

  goToCreate(): void {
    this.router.navigate(['/trainer/templates/new']);
  }
}
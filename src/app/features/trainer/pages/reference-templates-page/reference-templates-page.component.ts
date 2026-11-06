// ─────────────────────────────────────────────
//  PlanGym — ReferenceTemplatesPage (/trainer/templates/referencia)
//  Planes de referencia de PlanGym (solo lectura). "Usar este plan" los
//  copia a mis plantillas y abre la copia para editarla y asignarla.
// ─────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TemplateService } from '../../services/template.service';
import { ReferenceTemplate, WorkoutTemplate } from '../../models/trainer.models';
import { TemplateDayComponent } from '../../components/templates/template-day/template-day.component';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component.component';
import { PageLoaderComponent } from '../../../../shared/components/page-loader/page-loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorText } from '../../../../core/http/api-error.util';

const LEVEL_TEXT: Record<string, string> = {
  BASIC: 'Básico', BEGINNER: 'Básico', BASICO: 'Básico',
  INTERMEDIATE: 'Intermedio', INTERMEDIO: 'Intermedio', ADVANCED: 'Avanzado',
};

@Component({
  selector: 'app-reference-templates-page',
  standalone: true,
  imports: [RouterLink, TemplateDayComponent, ButtonComponent, PageLoaderComponent],
  templateUrl: './reference-templates-page.component.html',
  styleUrl: './reference-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceTemplatesPageComponent {
  private readonly api = inject(TemplateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly plans     = signal<ReferenceTemplate[]>([]);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);

  readonly openId    = signal<number | null>(null);
  readonly detail    = signal<WorkoutTemplate | null>(null);
  readonly loadingDetail = signal(false);
  readonly copyingId = signal<number | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.api.getReferences().subscribe({
      next: list => { this.plans.set(list); this.isLoading.set(false); },
      error: err => { this.error.set(apiErrorText(err, 'No pudimos cargar los planes de referencia.')); this.isLoading.set(false); },
    });
  }

  level(p: ReferenceTemplate): string | null {
    return p.level ? (LEVEL_TEXT[p.level.toUpperCase()] ?? p.level) : null;
  }

  toggle(p: ReferenceTemplate): void {
    if (this.openId() === p.id) { this.openId.set(null); return; }
    this.openId.set(p.id);
    this.detail.set(null);
    this.loadingDetail.set(true);
    this.api.getReference(p.id).subscribe({
      next: d => { if (this.openId() === p.id) this.detail.set(d); this.loadingDetail.set(false); },
      error: err => { this.loadingDetail.set(false); this.toast.error(apiErrorText(err)); },
    });
  }

  sortedDays(t: WorkoutTemplate) {
    return [...(t.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  use(p: ReferenceTemplate): void {
    this.copyingId.set(p.id);
    this.api.copyReference(p.id).subscribe({
      next: copy => {
        this.copyingId.set(null);
        this.toast.success(`"${copy.name}" quedó en tus plantillas. Adaptalo a tu alumno.`);
        this.router.navigate(['/trainer/templates', copy.id]);
      },
      error: err => { this.copyingId.set(null); this.toast.error(apiErrorText(err, 'No se pudo copiar el plan.')); },
    });
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalLayoutComponent, LegalSection } from '../legal-layout/legal-layout.component';
import { LEGAL } from '../legal.config';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [LegalLayoutComponent, RouterLink],
  templateUrl: './terms-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPageComponent {
  readonly legal = LEGAL;
  readonly sections: LegalSection[] = [
    { id: 'aceptacion', title: 'Aceptación' },
    { id: 'servicio', title: 'Qué es PlanGym' },
    { id: 'cuentas', title: 'Cuentas y acceso' },
    { id: 'entrenador', title: 'Responsabilidades del entrenador' },
    { id: 'salud', title: 'Salud y actividad física' },
    { id: 'uso', title: 'Uso aceptable' },
    { id: 'contenido', title: 'Contenido y propiedad intelectual' },
    { id: 'precio', title: 'Precio y pagos' },
    { id: 'disponibilidad', title: 'Disponibilidad del servicio' },
    { id: 'responsabilidad', title: 'Limitación de responsabilidad' },
    { id: 'baja', title: 'Baja y suspensión' },
    { id: 'cambios', title: 'Cambios en los términos' },
    { id: 'ley', title: 'Ley aplicable' },
    { id: 'contacto', title: 'Contacto' },
  ];
}

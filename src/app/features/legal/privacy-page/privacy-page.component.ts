import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalLayoutComponent, LegalSection } from '../legal-layout/legal-layout.component';
import { LEGAL } from '../legal.config';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [LegalLayoutComponent, RouterLink],
  templateUrl: './privacy-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPageComponent {
  readonly legal = LEGAL;
  readonly sections: LegalSection[] = [
    { id: 'responsable', title: 'Quién es responsable' },
    { id: 'roles', title: 'Entrenadores y alumnos' },
    { id: 'datos', title: 'Qué datos tratamos' },
    { id: 'salud', title: 'Datos de salud' },
    { id: 'finalidades', title: 'Para qué los usamos' },
    { id: 'base', title: 'Base legal' },
    { id: 'terceros', title: 'Con quién los compartimos' },
    { id: 'transferencia', title: 'Transferencia internacional' },
    { id: 'conservacion', title: 'Cuánto tiempo los guardamos' },
    { id: 'seguridad', title: 'Seguridad' },
    { id: 'derechos', title: 'Tus derechos' },
    { id: 'menores', title: 'Menores de edad' },
    { id: 'almacenamiento', title: 'Almacenamiento en tu dispositivo' },
    { id: 'cambios', title: 'Cambios en esta política' },
    { id: 'contacto', title: 'Contacto' },
  ];
}

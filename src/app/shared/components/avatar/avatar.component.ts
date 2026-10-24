import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

type AvatarColor = { bg: string; border: string; color: string };

const AVATAR_COLORS: AvatarColor[] = [
  { bg: 'rgba(79,110,247,0.2)',  border: 'rgba(79,110,247,0.4)',  color: '#818CF8' }, // blue
  { bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.4)', color: '#C4B5FD' }, // purple
  { bg: 'rgba(34,197,94,0.2)',  border: 'rgba(34,197,94,0.4)',  color: '#86EFAC' }, // green
  { bg: 'rgba(56,189,248,0.2)', border: 'rgba(56,189,248,0.4)', color: '#7DD3FC' }, // celeste
  { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', color: '#FCD34D' }, // amber
  { bg: 'rgba(239,68,68,0.2)',  border: 'rgba(239,68,68,0.4)',  color: '#FCA5A5' }, // red
];

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css'

})
export class AvatarComponent {
  // ── Inputs ──
  readonly initials = input.required<string>();
  
  // Opcional: Para mantener el mismo color por ID de usuario
  readonly identifier = input<number | string>();
  
  // Opcional: Si está pendiente, forzamos el color ámbar como en tu diseño
  readonly isPending = input<boolean>(false);

  // ── Computed ──
  readonly color = computed<AvatarColor>(() => {
    // Si está pendiente, siempre devuelve ámbar
    if (this.isPending()) {
      return { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', color: '#FCD34D' };
    }

    const id = this.identifier();
    let index = 0;

    // Si pasamos un ID numérico, asignamos color por el módulo
    if (typeof id === 'number') {
      index = id % AVATAR_COLORS.length;
    } 
    // Si no hay ID, generamos un índice "random" basado en el texto de las iniciales
    else {
      const textToHash = typeof id === 'string' ? id : this.initials();
      let hash = 0;
      for (let i = 0; i < textToHash.length; i++) {
        hash = textToHash.charCodeAt(i) + ((hash << 5) - hash);
      }
      index = Math.abs(hash) % AVATAR_COLORS.length;
    }

    return AVATAR_COLORS[index];
  });
}

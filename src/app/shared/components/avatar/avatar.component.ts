import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

type AvatarColor = { bg: string; border: string; color: string };

const AVATAR_COLORS: AvatarColor[] = [
  { bg: 'var(--color-accent-a20)', border: 'var(--color-accent-a40)', color: 'var(--color-accent-soft)' }, // blue
  { bg: 'var(--color-violet-a20)', border: 'var(--color-violet-a40)', color: 'var(--color-violet-soft)' }, // purple
  { bg: 'var(--color-success-a20)', border: 'var(--color-success-a40)', color: 'var(--color-success-soft)' }, // green
  { bg: 'var(--color-celeste-a20)', border: 'var(--color-celeste-a40)', color: 'var(--color-celeste-soft)' }, // celeste
  { bg: 'var(--color-warning-a20)', border: 'var(--color-warning-a40)', color: 'var(--color-warning-soft)' }, // amber
  { bg: 'var(--color-danger-a20)', border: 'var(--color-danger-a40)', color: 'var(--color-danger-soft)' }, // red
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
      return { bg: 'var(--color-warning-a20)', border: 'var(--color-warning-a40)', color: 'var(--color-warning-soft)' };
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

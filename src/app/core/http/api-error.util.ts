// ─────────────────────────────────────────────
//  PlanGym — apiErrorText
//  El backend responde { status, error, message, path, timestamp }
//  con `message` en castellano listo para mostrar (400/403/404/409).
// ─────────────────────────────────────────────

import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  timestamp?: string;
}

/** `message` del backend para cualquier status; si no viene, el fallback. */
export function apiErrorText(err: unknown, fallback = 'Algo salió mal. Probá de nuevo.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No hay conexión con el servidor.';
    const body = err.error as ApiErrorBody | string | null;
    if (body && typeof body === 'object' && body.message) return body.message;
  }
  return fallback;
}

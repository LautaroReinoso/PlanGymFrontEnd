export type CalTone = 'confirmed' | 'completed' | 'noshow' | 'cancelled' | 'free';

/** Entrada genérica del calendario (una clase o un turno). */
export interface CalEntry {
  key: string;
  dateKey: string;      // YYYY-MM-DD
  time: string;         // HH:mm
  endTime?: string;
  title: string;
  subtitle?: string;
  meta?: string;        // ej. "7/10"
  people?: number;      // alumnos (para el resumen del mes)
  tone: CalTone;
  past: boolean;
  fixed?: boolean;      // horario fijo
  /** horario libre (no es una clase del usuario): se muestra tenue y se toca para recuperar */
  free?: boolean;
}

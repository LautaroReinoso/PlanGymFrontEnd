// Última vista del calendario por rol (localStorage, con try/catch).
export type CalendarView = 'week' | 'month';

export function loadView(key: string, fallback: CalendarView): CalendarView {
  try {
    const v = localStorage.getItem(key);
    return v === 'week' || v === 'month' ? v : fallback;
  } catch { return fallback; }
}

export function saveView(key: string, view: CalendarView): void {
  try { localStorage.setItem(key, view); } catch { /* sin storage: no pasa nada */ }
}

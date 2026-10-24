

import { Injectable, signal, Signal } from '@angular/core';
 
// Claves centralizadas — evita strings sueltos en la app
export const STORAGE_KEYS = {
  AUTH_TOKEN:   'gp_auth_token',
  AUTH_MAIL:    'gp_auth_mail',
  AUTH_ROLES:   'gp_auth_roles',
  AUTH_EXPIRES: 'gp_auth_expires',
  THEME:        'gp_theme',
  LAST_ROUTE:   'gp_last_route',
} as const;
 
// Último modo de login usado ('trainer' | 'student').
// Va FUERA de STORAGE_KEYS a propósito: clearAll() (logout / token vencido)
// borra todo STORAGE_KEYS, y este dato tiene que sobrevivir para que el
// alumno vuelva a ver su pantalla de login.
export const LOGIN_MODE_KEY = 'gp_login_mode';

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
 
// ─────────────────────────────────────────────
//  StorageService
// ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class StorageService {
 
  // ── Helpers internos ────────────────────────
 
  private isAvailable(storage: Storage): boolean {
    try {
      const testKey = '__gp_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
 
  // ── localStorage ────────────────────────────
 
  /**
   * Persiste un valor en localStorage.
   * Serializa objetos/arrays automáticamente.
   */
  setLocal<T>(key: StorageKey, value: T): void {
    if (!this.isAvailable(localStorage)) return;
    const serialized = typeof value === 'string'
      ? value
      : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  }
 
  /**
   * Recupera un valor de localStorage.
   * Intenta parsear JSON; si falla, retorna el string crudo.
   * Retorna `null` si la clave no existe.
   */
  getLocal<T>(key: StorageKey): T | null {
    if (!this.isAvailable(localStorage)) return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
 
  /**
   * Retorna el valor como Signal reactivo de solo lectura.
   * El signal se actualiza manualmente — útil para exponer
   * en componentes sin necesidad de suscripciones.
   */
  getLocalSignal<T>(key: StorageKey): Signal<T | null> {
    const s = signal<T | null>(this.getLocal<T>(key));
    return s.asReadonly();
  }
 
  removeLocal(key: StorageKey): void {
    if (!this.isAvailable(localStorage)) return;
    localStorage.removeItem(key);
  }
 
  // ── sessionStorage ───────────────────────────
 
  /**
   * Persiste un valor en sessionStorage (se borra al cerrar pestaña).
   */
  setSession<T>(key: StorageKey, value: T): void {
    if (!this.isAvailable(sessionStorage)) return;
    const serialized = typeof value === 'string'
      ? value
      : JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
  }
 
  /**
   * Recupera un valor de sessionStorage.
   */
  getSession<T>(key: StorageKey): T | null {
    if (!this.isAvailable(sessionStorage)) return null;
    const raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }
 
  removeSession(key: StorageKey): void {
    if (!this.isAvailable(sessionStorage)) return;
    sessionStorage.removeItem(key);
  }
 
  // ── Limpieza total ───────────────────────────
 
  /**
   * Elimina todas las claves de GymPlan de localStorage.
   * No toca claves de otras apps que puedan compartir el dominio.
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }
}
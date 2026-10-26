// ─────────────────────────────────────────────
//  GymPlan — AuthService (corregido)
//  Fix #1: restauración de sesión en constructor
//          explícito, no en inicializador de campo.
//  Fix #2: validación defensiva de cada campo.
//  Fix #3: manejo correcto de expiresAt como Date.
// ─────────────────────────────────────────────

import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

import {
  AuthSession,
  AuthResponse,
  JwtPayload,
  LoginRequest,
  LoginMode,
  RoleType,
  StudentAuthResponse,
} from '../../models/auth/auth.models';
import { StorageService, STORAGE_KEYS, LOGIN_MODE_KEY } from '../services/storage.service';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http    = inject(HttpClient);
  private readonly router  = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly env     = inject(ENVIRONMENT);
  private readonly API_URL = this.env.apiUrl;

  // ── Estado reactivo ───────────────────────────
  // FIX #1: inicializar con null, restaurar en constructor
  // para garantizar que storage ya está inyectado.
  private readonly _session = signal<AuthSession | null>(null);

  readonly session      = this._session.asReadonly();
  readonly isLogged     = computed(() => this._session() !== null);
  readonly currentMail  = computed(() => this._session()?.mail ?? null);
  readonly currentRoles = computed(() => this._session()?.roles ?? []);

  readonly isTrainer     = computed(() => this.hasRole('ROLE_TRAINER'));
  readonly isStudent     = computed(() => this.hasRole('ROLE_STUDENT'));
  readonly isAdmin       = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly isGlobalAdmin = computed(() => this.hasRole('ROLE_GLOBAL_ADMIN'));
  readonly isGymAdmin    = computed(() => this.hasRole('ROLE_GYM_ADMIN'));

  // ── Constructor: único lugar seguro para restaurar sesión ──
  constructor() {
    // En este punto TODOS los inject() ya resolvieron.
    // Es el lugar correcto y garantizado para leer storage.
    const session = this.loadSessionFromStorage();
    if (session) {
      this._session.set(session);
    }
  }

  // ── Login ─────────────────────────────────────
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(err => this.handleAuthError(err))
      );
  }

  // ── Login de alumno (solo DNI) ────────────────
  loginStudent(dni: string): Observable<StudentAuthResponse> {
    return this.http
      .post<StudentAuthResponse>(`${this.API_URL}/auth/student/login`, { dni })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(err => this.handleStudentAuthError(err))
      );
  }

  // ── Logout ────────────────────────────────────
  logout(): void {
    // El alumno vuelve a SU pantalla de login (antes de limpiar la sesión)
    const wasStudentOnly = this.isStudent() && !this.isTrainer();

    this._session.set(null);
    this.storage.clearAll();
    this.router.navigate(wasStudentOnly ? ['/login', 'alumno'] : ['/login']);
  }

  // ── Token ─────────────────────────────────────
  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  isTokenValid(): boolean {
    const session = this._session();
    if (!session) return false;
    // Margen de 10 segundos para evitar race conditions
    return session.expiresAt.getTime() > Date.now() + 10_000;
  }

  // ── Roles ─────────────────────────────────────
  hasRole(role: RoleType): boolean {
    return this.currentRoles().includes(role);
  }

  hasAnyRole(...roles: RoleType[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  // ── Privados ──────────────────────────────────

  private handleAuthSuccess(response: AuthResponse): void {
    const payload  = this.decodeJwt(response.accessToken);
    const session: AuthSession = {
      token:     response.accessToken,
      mail:      payload.sub,
      roles:     payload.roles,
      expiresAt: new Date(payload.exp * 1000),
    };

    this._session.set(session);

    // FIX #3: guardar expiresAt como timestamp numérico (evita
    // ambigüedad de parsing de strings ISO en distintos browsers)
    this.storage.setLocal(STORAGE_KEYS.AUTH_TOKEN,   session.token);
    this.storage.setLocal(STORAGE_KEYS.AUTH_MAIL,    session.mail);
    this.storage.setLocal(STORAGE_KEYS.AUTH_ROLES,   session.roles);
    this.storage.setLocal(STORAGE_KEYS.AUTH_EXPIRES, session.expiresAt.getTime());

    this.rememberLoginMode(session.roles);
    this.redirectAfterLogin(session.roles);
  }

  // Recuerda el último modo para mostrar la pantalla correcta
  // cuando la sesión vence o el usuario cierra sesión.
  private rememberLoginMode(roles: RoleType[]): void {
    const mode: LoginMode =
      roles.includes('ROLE_STUDENT') && !roles.includes('ROLE_TRAINER')
        ? 'student'
        : 'trainer';
    try {
      localStorage.setItem(LOGIN_MODE_KEY, mode);
    } catch {
      /* storage no disponible: se ignora */
    }
  }

  private redirectAfterLogin(roles: RoleType[]): void {
    if (roles.includes('ROLE_TRAINER') || roles.includes('ROLE_ADMIN')) {
      this.router.navigate(['/trainer/students']);
    } else if (roles.includes('ROLE_STUDENT')) {
      this.router.navigate(['/student/dashboard']);
    } else if (roles.includes('ROLE_GLOBAL_ADMIN') || roles.includes('ROLE_GYM_ADMIN')) {
      this.router.navigate(['/admin/trainers']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private loadSessionFromStorage(): AuthSession | null {
    try {
      const token     = this.storage.getLocal<string>(STORAGE_KEYS.AUTH_TOKEN);
      const mail      = this.storage.getLocal<string>(STORAGE_KEYS.AUTH_MAIL);
      const roles     = this.storage.getLocal<RoleType[]>(STORAGE_KEYS.AUTH_ROLES);
      // FIX #3: leer como número (timestamp), no como string ISO
      const expiresMs = this.storage.getLocal<number>(STORAGE_KEYS.AUTH_EXPIRES);

      // FIX #2: validación defensiva de cada campo
      if (!token || typeof token !== 'string') return null;
      if (!mail  || typeof mail  !== 'string') return null;
      if (!Array.isArray(roles) || roles.length === 0) return null;
      if (!expiresMs || typeof expiresMs !== 'number') return null;

      const expiresAt = new Date(expiresMs);

      // Token expirado → limpiar storage silenciosamente
      if (expiresAt.getTime() <= Date.now() + 10_000) {
        this.storage.clearAll();
        return null;
      }

      return { token, mail, roles, expiresAt };

    } catch (error) {
      // Si localStorage está corrupto o inaccessible, limpiar y continuar
      console.warn('[AuthService] Error restaurando sesión desde storage:', error);
      this.storage.clearAll();
      return null;
    }
  }

  private decodeJwt(token: string): JwtPayload {
    try {
      const base64Payload = token.split('.')[1];
      const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      throw new Error('[AuthService] JWT malformado — no se pudo decodificar el payload');
    }
  }

  // El backend manda el mensaje listo para mostrar (ApiErrorResponse.message)
  private handleStudentAuthError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error inesperado. Intentá de nuevo.';
    if (error.status === 0) {
      message = 'No se pudo conectar con el servidor.';
    } else if ([400, 401, 403].includes(error.status)) {
      message = error.error?.message
        ?? 'No pudimos ingresar con ese DNI. Consultá con tu entrenador.';
    }
    return throwError(() => new Error(message));
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error inesperado. Intentá de nuevo.';
    if (error.status === 401) message = 'Credenciales incorrectas.';
    else if (error.status === 403) message = 'No tenés permisos para acceder.';
    else if (error.status === 0)   message = 'No se pudo conectar con el servidor.';
    return throwError(() => new Error(message));
  }
}
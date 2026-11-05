// ─────────────────────────────────────────────
//  PlanGym — BookingHttp
//  Cliente base del módulo de turnos:
//  • base `${apiUrl}/booking/plangym`
//  • cache de GETs por URL+params durante 60 s
//  • cualquier mutación invalida toda la cache
//  • un 403 marca el módulo como apagado (oculta "Turnos")
// ─────────────────────────────────────────────

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, tap, catchError, throwError, shareReplay, map } from 'rxjs';
import { ENVIRONMENT } from '../../../../environments/tokens/environment.token';

const CACHE_MS = 60_000;

type Params = object;

@Injectable({ providedIn: 'root' })
export class BookingHttp {
  private readonly http = inject(HttpClient);
  readonly base = `${inject(ENVIRONMENT).apiUrl}/booking/plangym`;

  /** undefined = no se sabe todavía · true = módulo prendido · false = 403 (apagado) */
  private readonly _enabled = signal<boolean | undefined>(undefined);
  readonly enabled = this._enabled.asReadonly();

  private readonly cache = new Map<string, { at: number; obs: Observable<unknown> }>();

  get<T>(path: string, params?: Params, useCache = true): Observable<T> {
    const httpParams = this.toParams(params);
    const key = `${path}?${httpParams.toString()}`;
    const hit = this.cache.get(key);
    if (useCache && hit && Date.now() - hit.at < CACHE_MS) return hit.obs as Observable<T>;

    const obs = this.http.get<T>(`${this.base}${path}`, { params: httpParams }).pipe(
      tap(() => this._enabled.set(true)),
      catchError(err => { this.cache.delete(key); return this.fail(err); }),
      shareReplay(1),
    );
    if (useCache) this.cache.set(key, { at: Date.now(), obs });
    return obs;
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.mutate(this.http.post<T>(`${this.base}${path}`, body));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.mutate(this.http.put<T>(`${this.base}${path}`, body));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.mutate(this.http.patch<T>(`${this.base}${path}`, body));
  }

  delete<T>(path: string): Observable<T> {
    return this.mutate(this.http.delete<T>(`${this.base}${path}`));
  }

  invalidate(): void { this.cache.clear(); }

  /**
   * Chequea si el módulo está prendido con un GET liviano.
   * Devuelve true/false; nunca falla.
   */
  probe(path: string): Observable<boolean> {
    if (this._enabled() !== undefined) return of(this._enabled()!);
    return this.get<unknown>(path).pipe(map(() => true), catchError(() => of(this._enabled() ?? false)));
  }

  private mutate<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(
      tap(() => this.invalidate()),
      catchError(err => { this.invalidate(); return this.fail(err); }),
    );
  }

  private fail(err: unknown): Observable<never> {
    // El módulo apagado responde 403 en todo. Un 403 puntual (sin permiso
    // sobre un recurso) solo apaga si todavía no habíamos visto un 2xx.
    if (err instanceof HttpErrorResponse && err.status === 403 && this._enabled() !== true) {
      this._enabled.set(false);
    }
    return throwError(() => err);
  }

  private toParams(params?: Params): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries((params ?? {}) as Record<string, unknown>)) {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    }
    return p;
  }
}

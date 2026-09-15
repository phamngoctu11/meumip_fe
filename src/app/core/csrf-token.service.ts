import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiResponse, CsrfTokenResponse } from './models';

@Injectable({ providedIn: 'root' })
export class CsrfTokenService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private cached: CsrfTokenResponse | null = null;
  private pending: Observable<CsrfTokenResponse> | null = null;
  private generation = 0;

  get(): Observable<CsrfTokenResponse> {
    if (this.cached) return of(this.cached);
    if (this.pending) return this.pending;

    const generation = this.generation;
    let request$: Observable<CsrfTokenResponse>;
    request$ = this.http
      .get<ApiResponse<CsrfTokenResponse>>(`${API_BASE_URL}/auth/csrf`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (!response.success || !response.data?.headerName || !response.data.token) {
            throw new Error(response.message || 'Unable to obtain CSRF token');
          }
          return response.data;
        }),
        tap((token) => {
          if (this.generation === generation) this.cached = token;
        }),
        finalize(() => {
          if (this.pending === request$) this.pending = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.pending = request$;
    return request$;
  }

  invalidate(): void {
    this.generation++;
    this.cached = null;
    this.pending = null;
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { ShopUser } from './models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApiService);

  readonly user = signal<ShopUser | null>(null);
  readonly checkingSession = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  checkSession(): Observable<ShopUser | null> {
    this.checkingSession.set(true);
    return this.api
      .getCurrentUser()
      .pipe(
        tap((user) => this.user.set(user)),
        catchError(() => {
          this.user.set(null);
          return of(null);
        }),
        finalize(() => this.checkingSession.set(false)),
      );
  }

  login(email: string, password: string): Observable<ShopUser> {
    this.submitting.set(true);
    this.error.set(null);
    return this.api.login({ email, password }).pipe(
      tap({
        next: (user) => this.user.set(user),
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Email hoặc mật khẩu chưa đúng.'),
      }),
      finalize(() => this.submitting.set(false)),
    );
  }

  logout(onSuccess?: () => void): void {
    this.submitting.set(true);
    this.api
      .logout()
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.user.set(null);
          this.error.set(null);
          onSuccess?.();
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Chưa thể đăng xuất. Vui lòng thử lại.'),
      });
  }

  clearError(): void {
    this.error.set(null);
  }
}

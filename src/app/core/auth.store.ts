import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { LoginResponse, MfaChallenge, MfaNextStep, ShopUser } from './models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApiService);

  readonly user = signal<ShopUser | null>(null);
  readonly checkingSession = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingMfa = signal<MfaNextStep | null>(null);

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

  login(email: string, password: string): Observable<LoginResponse> {
    this.submitting.set(true);
    this.error.set(null);
    return this.api.login({ email, password }).pipe(
      tap({
        next: (result) => {
          if (this.isMfaChallenge(result)) {
            this.user.set(null);
            this.pendingMfa.set(result.nextStep);
          } else {
            this.user.set(result);
            this.pendingMfa.set(null);
          }
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.error?.message === 'EMAIL_VERIFICATION_REQUIRED'
              ? 'Email của bạn chưa được xác thực.'
              : (error.error?.message ?? 'Email hoặc mật khẩu chưa đúng.'),
          ),
      }),
      finalize(() => this.submitting.set(false)),
    );
  }

  verifyMfa(code: string): Observable<ShopUser> {
    this.submitting.set(true);
    this.error.set(null);
    return this.api.verifyMfa(code).pipe(
      tap({
        next: (user) => {
          this.user.set(user);
          this.pendingMfa.set(null);
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(
            error.status === 401
              ? 'Mã xác thực không đúng, đã được dùng hoặc phiên đăng nhập đã hết hạn.'
              : (error.error?.message ?? 'Chưa thể xác thực MFA.'),
          ),
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
          this.pendingMfa.set(null);
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

  clearMfaChallenge(): void {
    this.pendingMfa.set(null);
  }

  clearLocalSession(): void {
    this.user.set(null);
    this.pendingMfa.set(null);
    this.error.set(null);
  }

  private isMfaChallenge(result: LoginResponse): result is MfaChallenge {
    return 'nextStep' in result;
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  MfaEnrollment,
  RegisterRequest,
  ShopUser,
} from './models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', request).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  register(request: RegisterRequest): Observable<ShopUser> {
    return this.post<ShopUser>('/auth/register', request).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  requestVerificationEmail(email: string): Observable<string> {
    return this.post<null>('/auth/verification-email', { email }).pipe(
      map((response) => this.messageFrom(response)),
    );
  }

  verifyEmail(token: string): Observable<string> {
    return this.post<null>('/auth/verify-email', { token }).pipe(
      map((response) => this.messageFrom(response)),
    );
  }

  requestPasswordReset(email: string): Observable<string> {
    return this.post<null>('/auth/forgot-password', { email }).pipe(
      map((response) => this.messageFrom(response)),
    );
  }

  resetPassword(token: string, password: string): Observable<string> {
    return this.post<null>('/auth/reset-password', { token, password }).pipe(
      map((response) => this.messageFrom(response)),
    );
  }

  requestMfaEnrollmentEmail(): Observable<string> {
    return this.post<null>('/auth/mfa/enrollment-email', null).pipe(
      map((response) => this.messageFrom(response)),
    );
  }

  setupMfa(token: string): Observable<MfaEnrollment> {
    return this.post<MfaEnrollment>('/auth/mfa/setup', { token }).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  confirmMfa(code: string): Observable<string[]> {
    return this.post<string[]>('/auth/mfa/confirm', { code }).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  verifyMfa(code: string): Observable<ShopUser> {
    return this.post<ShopUser>('/auth/mfa/verify', { code }).pipe(
      map((response) => this.unwrap(response)),
    );
  }

  resetMfa(password: string, code: string): Observable<string> {
    return this.post<null>('/auth/mfa/reset', { password, code }).pipe(
      map((response) => this.messageFrom(response)),
    );
  }

  logoutAll(): Observable<void> {
    return this.post<null>('/auth/logout-all', null).pipe(map(() => undefined));
  }

  getCurrentUser(): Observable<ShopUser> {
    return this.http
      .get<ApiResponse<ShopUser>>(`${API_BASE_URL}/auth/me`, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  logout(): Observable<void> {
    return this.post<null>('/auth/logout', null).pipe(map(() => undefined));
  }

  private post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${API_BASE_URL}${path}`, body, {
      withCredentials: true,
    });
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data;
  }

  private messageFrom(response: ApiResponse<unknown>): string {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.message;
  }
}

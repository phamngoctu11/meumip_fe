import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiResponse, LoginRequest, RegisterRequest, ShopUser } from './models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<ShopUser> {
    return this.http
      .post<ApiResponse<ShopUser>>(`${API_BASE_URL}/auth/login`, request, {
        withCredentials: true,
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  register(request: RegisterRequest): Observable<ShopUser> {
    return this.http
      .post<ApiResponse<ShopUser>>(`${API_BASE_URL}/auth/register`, request, {
        withCredentials: true,
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  getCurrentUser(): Observable<ShopUser> {
    return this.http
      .get<ApiResponse<ShopUser>>(`${API_BASE_URL}/auth/me`, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${API_BASE_URL}/auth/logout`, null, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data;
  }
}

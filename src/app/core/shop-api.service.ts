import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  Cart,
  CheckoutRequest,
  CheckoutResponse,
  Order,
  ProductDetail,
  ProductSummary,
} from './models';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<ProductSummary[]> {
    return this.http
      .get<ApiResponse<ProductSummary[]>>(`${API_BASE_URL}/products`)
      .pipe(map((response) => this.unwrap(response)));
  }

  getProduct(slug: string): Observable<ProductDetail> {
    return this.http
      .get<ApiResponse<ProductDetail>>(`${API_BASE_URL}/products/${encodeURIComponent(slug)}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  getCart(sessionId: string | null): Observable<Cart> {
    let params = new HttpParams();
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) {
      params = params.set('sessionId', resolvedSessionId);
    }
    return this.http
      .get<ApiResponse<Cart>>(`${API_BASE_URL}/cart`, { params, withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  addCartItem(sessionId: string | null, productId: number, quantity: number): Observable<Cart> {
    const body: { sessionId?: string; productId: number; quantity: number } = {
      productId,
      quantity,
    };
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) {
      body.sessionId = resolvedSessionId;
    }

    return this.http
      .post<ApiResponse<Cart>>(
        `${API_BASE_URL}/cart/items`,
        body,
        { withCredentials: true },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http
      .post<ApiResponse<CheckoutResponse>>(`${API_BASE_URL}/checkout`, request, {
        withCredentials: true,
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  getMyOrders(): Observable<Order[]> {
    return this.http
      .get<ApiResponse<Order[]>>(`${API_BASE_URL}/orders/mine`, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  getOrder(orderCode: string): Observable<Order> {
    return this.http
      .get<ApiResponse<Order>>(`${API_BASE_URL}/orders/${encodeURIComponent(orderCode)}`, {
        withCredentials: true,
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data;
  }
}

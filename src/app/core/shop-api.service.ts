import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiResponse,
  Cart,
  CatalogItemType,
  CheckoutRequest,
  CheckoutResponse,
  HomeSlide,
  Order,
  ProductDetail,
  ProductSummary,
} from './models';

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  private readonly http = inject(HttpClient);

  getProducts(
    type?: CatalogItemType | string,
    q?: string,
    tag?: string,
    page = 0,
    size = 100,
  ): Observable<ProductSummary[]> {
    return this.queryProducts(`${API_BASE_URL}/products`, page, size, type, q, tag);
  }

  getHomeSlides(): Observable<HomeSlide[]> {
    return this.get<HomeSlide[]>(`${API_BASE_URL}/home/slides`);
  }

  getProduct(productId: number): Observable<ProductDetail> {
    return this.get<ProductDetail>(`${API_BASE_URL}/products/${productId}`);
  }

  getCart(sessionId: string | null): Observable<Cart> {
    let params = new HttpParams();
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) params = params.set('sessionId', resolvedSessionId);
    return this.http
      .get<ApiResponse<Cart>>(`${API_BASE_URL}/cart`, { params, withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  addCartItem(sessionId: string | null, productId: number, quantity: number): Observable<Cart> {
    const body: { sessionId?: string; productId: number; quantity: number } = { productId, quantity };
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) body.sessionId = resolvedSessionId;
    return this.http
      .post<ApiResponse<Cart>>(`${API_BASE_URL}/cart/items`, body, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  removeCartItem(sessionId: string | null, itemId: number): Observable<Cart> {
    let params = new HttpParams();
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) params = params.set('sessionId', resolvedSessionId);
    return this.http
      .delete<ApiResponse<Cart>>(`${API_BASE_URL}/cart/items/${itemId}`, {
        params,
        withCredentials: true,
      })
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

  private queryProducts(
    url: string,
    page: number,
    size: number,
    type?: CatalogItemType | string,
    q?: string,
    tag?: string,
  ): Observable<ProductSummary[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);
    if (q) params = params.set('q', q);
    if (tag) params = params.set('tag', tag);
    return this.http
      .get<ApiResponse<ProductSummary[]>>(url, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  private get<T>(url: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(url).pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) throw new Error(response.message || 'API request failed');
    return response.data;
  }
}

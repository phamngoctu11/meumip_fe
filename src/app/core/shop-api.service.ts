import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiResponse,
  Cart,
  CatalogItemType,
  Category,
  ComboBlankSelection,
  CheckoutRequest,
  CheckoutResponse,
  HomeCombo,
  HomeSlide,
  Order,
  ProductDetail,
  ProductBlank,
  ProductSummary,
} from './models';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ShopApiService {
  private readonly http = inject(HttpClient);

  getProducts(category?: string, page?: number, size?: number, type?: CatalogItemType | string, q?: string, tag?: string): Observable<ProductSummary[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (page !== undefined) params = params.set('page', page);
    if (size !== undefined) params = params.set('size', size);
    if (type) params = params.set('type', type);
    if (q) params = params.set('q', q);
    if (tag) params = params.set('tag', tag);
    return this.http
      .get<ApiResponse<ProductSummary[]>>(`${API_BASE_URL}/products`, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  getCatalog(type?: CatalogItemType | string, q?: string, tag?: string, page = 0, size = 100): Observable<ProductSummary[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);
    if (q) params = params.set('q', q);
    if (tag) params = params.set('tag', tag);
    return this.http
      .get<ApiResponse<ProductSummary[]>>(`${API_BASE_URL}/catalog`, { params })
      .pipe(map((response) => this.unwrap(response)));
  }

  getHomeSlides(): Observable<HomeSlide[]> { return this.get<HomeSlide[]>(`${API_BASE_URL}/home/slides`); }
  getHomeCombos(): Observable<HomeCombo[]> { return this.get<HomeCombo[]>(`${API_BASE_URL}/home/combos`); }
  getHomeCombo(comboId: number): Observable<HomeCombo> { return this.get<HomeCombo>(`${API_BASE_URL}/home/combos/${comboId}`); }
  getCategories(): Observable<Category[]> { return this.get<Category[]>(`${API_BASE_URL}/categories`); }
  getCategoryProducts(slug: string, limit = 2): Observable<ProductSummary[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ApiResponse<ProductSummary[]>>(`${API_BASE_URL}/categories/${encodeURIComponent(slug)}/products`, { params }).pipe(map((response) => this.unwrap(response)));
  }
  getProductBlanks(): Observable<ProductBlank[]> { return this.get<ProductBlank[]>(`${API_BASE_URL}/product-blanks`); }

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

  addCartItem(sessionId: string | null, productId: number, quantity: number, productBlankId?: number | null): Observable<Cart> {
    const body: { sessionId?: string; productId: number; productBlankId?: number | null; quantity: number } = {
      productId,
      quantity,
    };
    if (productBlankId) {
      body.productBlankId = productBlankId;
    }
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

  addCombo(sessionId: string | null, comboId: number, selections: ComboBlankSelection[], quantity = 1): Observable<Cart> {
    const body: { sessionId?: string; comboId: number; selections: ComboBlankSelection[]; quantity: number } = { comboId, selections, quantity };
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) body.sessionId = resolvedSessionId;
    return this.http.post<ApiResponse<Cart>>(`${API_BASE_URL}/cart/combos`, body, { withCredentials: true }).pipe(map((response) => this.unwrap(response)));
  }

  removeCartItem(sessionId: string | null, itemId: number): Observable<Cart> {
    let params = new HttpParams();
    const resolvedSessionId = sessionId?.trim();
    if (resolvedSessionId) {
      params = params.set('sessionId', resolvedSessionId);
    }
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

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data;
  }

  private get<T>(url: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(url).pipe(map((response) => this.unwrap(response)));
  }
}

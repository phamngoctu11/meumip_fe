import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiResponse,
  ChangeOrderStatusRequest,
  ConfirmPaymentRequest,
  HomeSlide,
  HomeSlideUpsertRequest,
  ImageUploadResponse,
  Order,
  Payment,
  ProductDetail,
  ProductUpsertRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly adminUrl = `${API_BASE_URL}/admin`;

  listSlides(): Observable<HomeSlide[]> {
    return this.get<HomeSlide[]>(`${this.adminUrl}/slides`);
  }

  createSlide(request: HomeSlideUpsertRequest): Observable<HomeSlide> {
    return this.post<HomeSlide>(`${this.adminUrl}/slides`, request);
  }

  updateSlide(slideId: number, request: HomeSlideUpsertRequest): Observable<HomeSlide> {
    return this.put<HomeSlide>(`${this.adminUrl}/slides/${slideId}`, request);
  }

  archiveSlide(slideId: number): Observable<HomeSlide> {
    return this.delete<HomeSlide>(`${this.adminUrl}/slides/${slideId}`);
  }

  changeSlideStatus(slideId: number, active: boolean): Observable<HomeSlide> {
    return this.patch<HomeSlide>(`${this.adminUrl}/slides/${slideId}/status`, { active });
  }

  listProducts(): Observable<ProductDetail[]> {
    return this.get<ProductDetail[]>(`${this.adminUrl}/products`);
  }

  getProduct(productId: number): Observable<ProductDetail> {
    return this.get<ProductDetail>(`${this.adminUrl}/products/${productId}`);
  }

  createProduct(request: ProductUpsertRequest): Observable<ProductDetail> {
    return this.post<ProductDetail>(`${this.adminUrl}/products`, request);
  }

  updateProduct(productId: number, request: ProductUpsertRequest): Observable<ProductDetail> {
    return this.put<ProductDetail>(`${this.adminUrl}/products/${productId}`, request);
  }

  deleteProduct(productId: number): Observable<ProductDetail> {
    return this.delete<ProductDetail>(`${this.adminUrl}/products/${productId}`);
  }

  uploadImage(file: File): Observable<ImageUploadResponse> {
    const body = new FormData();
    body.append('file', file);
    return this.post<ImageUploadResponse>(`${this.adminUrl}/images`, body);
  }

  listOrders(): Observable<Order[]> {
    return this.get<Order[]>(`${this.adminUrl}/orders`);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.get<Order>(`${this.adminUrl}/orders/${orderId}`);
  }

  changeOrderStatus(orderId: number, request: ChangeOrderStatusRequest): Observable<Order> {
    return this.patch<Order>(`${this.adminUrl}/orders/${orderId}/status`, request);
  }

  confirmPayment(orderId: number, request: ConfirmPaymentRequest): Observable<Payment> {
    return this.post<Payment>(`${this.adminUrl}/orders/${orderId}/payments/confirm`, request);
  }

  private get<T>(url: string): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(url, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  private post<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(url, body, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  private put<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(url, body, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  private patch<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(url, body, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  private delete<T>(url: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(url, { withCredentials: true })
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) throw new Error(response.message || 'API request failed');
    return response.data;
  }
}

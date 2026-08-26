import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { AuthStore } from './auth.store';
import { Cart, ComboBlankSelection } from './models';
import { ShopApiService } from './shop-api.service';

const CART_SESSION_KEY = 'meumip_cart_session';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly api = inject(ShopApiService);
  private readonly authStore = inject(AuthStore);
  private readonly cartState = signal<Cart | null>(null);

  readonly cart = this.cartState.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly itemCount = computed(() => this.cartState()?.itemCount ?? 0);
  readonly sessionId = signal(this.getOrCreateSessionId());

  load(): void {
    this.loading.set(true);
    this.api
      .getCart(this.requestSessionId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (cart) => {
          this.cartState.set(cart);
          this.error.set(null);
        },
        error: () => this.error.set('Chưa thể kết nối với giỏ hàng. Vui lòng bật backend và thử lại.'),
      });
  }

  add(productId: number, quantity: number, selectedBlanks: ComboBlankSelection[] = []): Observable<Cart> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.addCartItem(this.requestSessionId(), productId, quantity, selectedBlanks).pipe(
      tap({
        next: (cart) => this.cartState.set(cart),
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Không thể thêm sản phẩm vào giỏ.'),
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  remove(itemId: number): Observable<Cart> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.removeCartItem(this.requestSessionId(), itemId).pipe(
      tap({
        next: (cart) => this.cartState.set(cart),
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Không thể xóa sản phẩm khỏi giỏ.'),
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  requestSessionId(): string | null {
    const currentCartSessionId = this.cartState()?.sessionId?.trim();
    if (currentCartSessionId) return currentCartSessionId;
    return this.authStore.user() ? null : this.sessionId();
  }

  resetAfterCheckout(): void {
    this.cartState.set(null);
    const newSessionId = this.createSessionId();
    this.sessionId.set(newSessionId);
    this.writeSessionId(newSessionId);
  }

  private getOrCreateSessionId(): string {
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem(CART_SESSION_KEY);
      if (existing) return existing;
    }
    const sessionId = this.createSessionId();
    this.writeSessionId(sessionId);
    return sessionId;
  }

  private createSessionId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `meumip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private writeSessionId(sessionId: string): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
}

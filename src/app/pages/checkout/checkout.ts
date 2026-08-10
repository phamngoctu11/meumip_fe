import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartStore } from '../../core/cart.store';
import { CheckoutRequest, CheckoutResponse, formatVnd } from '../../core/models';
import { ShopApiService } from '../../core/shop-api.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../shared/image-fallback.directive';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-checkout',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    EmptyState,
    FeedbackBanner,
    ImageFallbackDirective,
    PageHeader,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ShopApiService);
  readonly cartStore = inject(CartStore);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<CheckoutResponse | null>(null);
  readonly formatVnd = formatVnd;

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    customer: this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      recipientName: ['', [Validators.required, Validators.maxLength(120)]],
      recipientPhone: ['', [Validators.required, Validators.maxLength(30)]],
    }),
    address: this.formBuilder.nonNullable.group({
      province: ['', [Validators.required, Validators.maxLength(100)]],
      district: ['', Validators.maxLength(100)],
      ward: ['', Validators.maxLength(100)],
      addressLine: ['', [Validators.required, Validators.maxLength(255)]],
      postalCode: ['', Validators.maxLength(20)],
    }),
    customerNote: [''],
    saveAddress: [false],
  });

  submit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.error.set('Bạn kiểm tra lại các trường bắt buộc giúp meumip nhé.');
      return;
    }

    const cart = this.cartStore.cart();
    if (!cart?.items.length) {
      this.error.set('Giỏ hàng đang trống hoặc chưa thể kết nối với backend.');
      return;
    }

    const value = this.checkoutForm.getRawValue();
    const request: CheckoutRequest = {
      cartSessionId: cart.sessionId || this.cartStore.requestSessionId(),
      ...value.customer,
      ...value.address,
      customerNote: value.customerNote,
      saveAddress: value.saveAddress,
    };

    this.submitting.set(true);
    this.error.set(null);
    this.api
      .checkout(request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.cartStore.resetAfterCheckout();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Chưa thể tạo đơn hàng. Bạn vui lòng thử lại.'),
      });
  }

  isInvalid(group: 'customer' | 'address', control: string): boolean {
    const field =
      group === 'customer'
        ? this.checkoutForm.controls.customer.get(control)
        : this.checkoutForm.controls.address.get(control);
    return Boolean(field?.invalid && field.touched);
  }
}

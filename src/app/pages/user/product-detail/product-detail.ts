import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartStore } from '../../../core/cart.store';
import { formatVnd, ProductDetail as ProductDetailModel } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';
import { QuantityStepper } from '../../../shared/quantity-stepper/quantity-stepper';

@Component({
  selector: 'app-product-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    EmptyState,
    FeedbackBanner,
    ImageFallbackDirective,
    QuantityStepper,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ShopApiService);
  readonly cartStore = inject(CartStore);

  readonly product = signal<ProductDetailModel | null>(null);
  readonly selectedImage = signal('');
  readonly loading = signal(true);
  readonly added = signal(false);
  readonly error = signal<string | null>(null);
  readonly formatVnd = formatVnd;

  readonly cartForm = new FormGroup({
    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(99)],
    }),
  });

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      this.error.set('Mã sản phẩm không hợp lệ.');
      this.loading.set(false);
      return;
    }

    this.api
      .getProduct(productId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.selectedImage.set(
            product.primaryImageUrl || product.images[0]?.imageUrl || '/images/product-placeholder.svg',
          );
        },
        error: (error) => this.error.set(error.error?.message ?? 'Không tìm thấy sản phẩm.'),
      });
  }

  addToCart(): void {
    const product = this.product();
    if (!product || this.cartForm.invalid) return;
    this.added.set(false);
    this.error.set(null);
    this.cartStore.add(product.id, this.cartForm.controls.quantity.value).subscribe({
      next: () => this.added.set(true),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể thêm sản phẩm vào giỏ.'),
    });
  }
}

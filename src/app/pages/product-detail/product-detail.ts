import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CartStore } from '../../core/cart.store';
import { demoProductDetails } from '../../core/demo-products';
import { formatVnd, ProductDetail as ProductDetailModel } from '../../core/models';
import { ShopApiService } from '../../core/shop-api.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../shared/image-fallback.directive';
import { QuantityStepper } from '../../shared/quantity-stepper/quantity-stepper';

@Component({
  selector: 'app-product-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
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
  private readonly formBuilder = inject(FormBuilder);
  readonly cartStore = inject(CartStore);

  readonly product = signal<ProductDetailModel | null>(null);
  readonly selectedImage = signal(0);
  readonly purchaseForm = this.formBuilder.nonNullable.group({
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
  });
  readonly loading = signal(true);
  readonly previewMode = signal(false);
  readonly added = signal(false);
  readonly error = signal<string | null>(null);
  readonly formatVnd = formatVnd;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(null);
          this.previewMode.set(false);
          this.selectedImage.set(0);
          return this.api
            .getProduct(params.get('slug') ?? '')
            .pipe(finalize(() => this.loading.set(false)));
        }),
      )
      .subscribe({
        next: (product) => this.product.set(product),
        error: () => {
          const slug = this.route.snapshot.paramMap.get('slug') ?? '';
          const previewProduct = demoProductDetails[slug];
          if (previewProduct) {
            this.product.set(previewProduct);
            this.previewMode.set(true);
          } else {
            this.error.set('Không tìm thấy sản phẩm này.');
          }
        },
      });
  }

  selectImage(index: number): void {
    this.selectedImage.set(index);
  }

  addToCart(): void {
    const product = this.product();
    if (!product || product.status !== 'ACTIVE') {
      return;
    }

    this.added.set(false);
    if (this.purchaseForm.invalid) {
      return;
    }

    this.cartStore.add(product.id, this.purchaseForm.controls.quantity.value).subscribe({
      next: () => {
        this.added.set(true);
        window.setTimeout(() => this.added.set(false), 2500);
      },
      error: () => undefined,
    });
  }
}

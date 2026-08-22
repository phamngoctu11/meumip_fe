import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CartStore } from '../../../core/cart.store';
import { demoProductDetails } from '../../../core/demo-products';
import { formatVnd, ProductDetail as ProductDetailModel } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';
import { QuantityStepper } from '../../../shared/quantity-stepper/quantity-stepper';

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
    productBlankId: this.formBuilder.control<number | null>(null),
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
          this.purchaseForm.controls.productBlankId.setValue(null);
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
    if (product.type === 'KIT') {
      this.error.set('Combo kit cần chọn đủ phôi miễn phí ở khu vực Combo trên trang chủ.');
      return;
    }

    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      this.error.set('Bạn hãy kiểm tra lại số lượng trước khi thêm vào giỏ.');
      return;
    }

    const blankId = this.purchaseForm.controls.productBlankId.value;
    if (this.needsBlankSelection(product) && !blankId) {
      this.purchaseForm.controls.productBlankId.markAsTouched();
      this.error.set('Bạn hãy chọn một phôi trước khi thêm vào giỏ.');
      return;
    }

    this.error.set(null);
    this.cartStore.add(product.id, this.purchaseForm.controls.quantity.value, blankId).subscribe({
      next: () => {
        this.added.set(true);
        window.setTimeout(() => this.added.set(false), 2500);
      },
      error: () => undefined,
    });
  }

  needsBlankSelection(product: ProductDetailModel): boolean {
    return product.type !== 'KIT' && product.selectionRequired && product.blanks.length > 0;
  }

  canAddToCart(product: ProductDetailModel): boolean {
    return product.status === 'ACTIVE' && product.type !== 'KIT';
  }
}

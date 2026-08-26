import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartStore } from '../../../core/cart.store';
import {
  ComboBlankSelection,
  formatVnd,
  ProductDetail as ProductDetailModel,
  ProductSummary,
} from '../../../core/models';
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
  readonly availableBlanks = signal<ProductSummary[]>([]);
  readonly selectedBlankQuantities = signal<Record<number, number>>({});
  readonly blanksLoading = signal(false);
  readonly blanksError = signal<string | null>(null);
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
          if (product.type === 'KIT') this.loadAvailableBlanks();
        },
        error: (error) => this.error.set(error.error?.message ?? 'Không tìm thấy sản phẩm.'),
      });
  }

  addToCart(): void {
    const product = this.product();
    if (!product || this.cartForm.invalid) return;
    if (product.type === 'KIT' && !this.comboSelectionReady()) {
      this.error.set(`Vui lòng chọn đúng ${this.requiredBlankTotal()} phôi miễn phí.`);
      return;
    }
    this.added.set(false);
    this.error.set(null);
    this.cartStore.add(
      product.id,
      this.cartForm.controls.quantity.value,
      product.type === 'KIT' ? this.blankSelectionRequest() : [],
    ).subscribe({
      next: () => this.added.set(true),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể thêm sản phẩm vào giỏ.'),
    });
  }

  selectedBlankQuantity(blankId: number): number {
    return this.selectedBlankQuantities()[blankId] ?? 0;
  }

  selectedBlankTotal(): number {
    return Object.values(this.selectedBlankQuantities()).reduce((total, quantity) => total + quantity, 0);
  }

  requiredBlankTotal(): number {
    const product = this.product();
    if (!product || product.type !== 'KIT') return 0;
    return (product.includedBlankCount ?? 1) * this.cartForm.controls.quantity.value;
  }

  increaseBlank(blank: ProductSummary): void {
    if (this.selectedBlankTotal() >= this.requiredBlankTotal()) return;
    this.selectedBlankQuantities.update((current) => ({
      ...current,
      [blank.id]: (current[blank.id] ?? 0) + 1,
    }));
    this.error.set(null);
  }

  decreaseBlank(blank: ProductSummary): void {
    const current = this.selectedBlankQuantities();
    const quantity = current[blank.id] ?? 0;
    if (quantity <= 0) return;
    const next = { ...current };
    if (quantity === 1) delete next[blank.id];
    else next[blank.id] = quantity - 1;
    this.selectedBlankQuantities.set(next);
    this.error.set(null);
  }

  comboSelectionReady(): boolean {
    return this.selectedBlankTotal() === this.requiredBlankTotal();
  }

  blankCover(blank: ProductSummary): string {
    return blank.primaryImageUrl || blank.images[0]?.imageUrl || '/images/product-placeholder.svg';
  }

  private blankSelectionRequest(): ComboBlankSelection[] {
    return Object.entries(this.selectedBlankQuantities())
      .map(([productId, quantity]) => ({ productId: Number(productId), quantity }))
      .filter((selection) => selection.productId > 0 && selection.quantity > 0);
  }

  private loadAvailableBlanks(): void {
    this.blanksLoading.set(true);
    this.blanksError.set(null);
    this.api.getProducts('BLANK', undefined, undefined, 0, 100)
      .pipe(finalize(() => this.blanksLoading.set(false)))
      .subscribe({
        next: (blanks) => this.availableBlanks.set(blanks),
        error: (error) => this.blanksError.set(
          error.error?.message ?? 'Không thể tải danh sách phôi. Vui lòng thử lại.',
        ),
      });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { CatalogItemType, formatVnd, ProductDetail } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

@Component({
  selector: 'app-admin-products',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner, ImageFallbackDirective],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProducts implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly products = signal<ProductDetail[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly formatVnd = formatVnd;
  readonly productTypes: Array<{ value: CatalogItemType; label: string }> = [
    { value: 'BLANK', label: 'Phôi' },
    { value: 'KIT', label: 'Bộ kit' },
    { value: 'MATERIAL', label: 'Nguyên liệu' },
  ];

  readonly filterForm = this.formBuilder.nonNullable.group({ search: [''], type: ['ALL'] });
  readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );
  readonly visibleProducts = computed(() => {
    const { search, type } = this.filters();
    const term = (search ?? '').trim().toLowerCase();
    return this.products().filter(
      (product) =>
        (type === 'ALL' || product.type === type) &&
        (!term || product.name.toLowerCase().includes(term)),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listProducts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => this.error.set('Chưa thể tải danh sách sản phẩm.'),
      });
  }

  remove(product: ProductDetail): void {
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm “${product.name}”?`)) return;
    this.deletingId.set(product.id);
    this.error.set(null);
    this.success.set(null);
    this.api
      .deleteProduct(product.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.products.update((products) => products.filter((item) => item.id !== product.id));
          this.success.set(`Đã xóa sản phẩm “${product.name}”.`);
        },
        error: (error) =>
          this.error.set(error.error?.message ?? 'Không thể xóa sản phẩm đang được sử dụng.'),
      });
  }
}

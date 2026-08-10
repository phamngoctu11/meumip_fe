import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { formatVnd, ProductDetail } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';
import { PRODUCT_STATUSES, productStatusLabel } from '../admin.utils';

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
  readonly archivingId = signal<number | null>(null);
  readonly productStatuses = PRODUCT_STATUSES;
  readonly productStatusLabel = productStatusLabel;
  readonly formatVnd = formatVnd;

  readonly filterForm = this.formBuilder.nonNullable.group({
    search: [''],
    status: ['ALL'],
  });
  readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );
  readonly visibleProducts = computed(() => {
    const { search, status } = this.filters();
    const term = (search ?? '').trim().toLowerCase();
    return this.products().filter(
      (product) =>
        (status === 'ALL' || product.status === status) &&
        (!term || product.name.toLowerCase().includes(term) || product.slug.toLowerCase().includes(term)),
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

  archive(product: ProductDetail): void {
    const confirmed = window.confirm(
      `Ẩn sản phẩm “${product.name}”? Sản phẩm sẽ biến mất khỏi cửa hàng nhưng dữ liệu đơn cũ vẫn được giữ.`,
    );
    if (!confirmed) {
      return;
    }

    this.archivingId.set(product.id);
    this.error.set(null);
    this.success.set(null);
    this.api
      .archiveProduct(product.id)
      .pipe(finalize(() => this.archivingId.set(null)))
      .subscribe({
        next: (archived) => {
          this.products.update((products) =>
            products.map((item) => (item.id === archived.id ? archived : item)),
          );
          this.success.set(`Đã ẩn sản phẩm “${product.name}”.`);
        },
        error: () => this.error.set('Không thể ẩn sản phẩm. Vui lòng thử lại.'),
      });
  }
}

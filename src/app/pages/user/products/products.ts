import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CatalogItemType, ProductSummary } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { PageHeader } from '../../../shared/page-header/page-header';
import { ProductCard } from '../../../shared/product-card/product-card';

type ProductTypeFilter = {
  value: CatalogItemType;
  label: string;
  description: string;
};

const PRODUCT_TYPES: ProductTypeFilter[] = [
  { value: 'BLANK', label: 'Phôi lẻ', description: 'Các mẫu phôi trơn để tự làm móc khóa.' },
  { value: 'KIT', label: 'Combo Kit', description: 'Bộ kit giá cố định, chọn phôi miễn phí theo combo.' },
  { value: 'MATERIAL', label: 'Món bán lẻ', description: 'Đất, màu và nguyên liệu mua kèm.' },
];

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, EmptyState, FeedbackBanner, PageHeader, ProductCard],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ShopApiService);
  private readonly route = inject(ActivatedRoute);

  readonly products = signal<ProductSummary[]>([]);
  readonly selectedType = signal<CatalogItemType>('BLANK');
  readonly typeFilters = PRODUCT_TYPES;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(switchMap((params) => {
      const type = this.resolveType(params.get('type'));
      this.selectedType.set(type);
      this.loading.set(true);
      this.error.set(null);
      return this.api.getCatalog(type, undefined, undefined, 0, 100).pipe(finalize(() => this.loading.set(false)));
    })).subscribe({
      next: (products) => this.products.set(products),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể tải danh sách mặt hàng.'),
    });
  }

  selectedTypeInfo(): ProductTypeFilter {
    return this.typeFilters.find((type) => type.value === this.selectedType()) ?? this.typeFilters[0];
  }

  private resolveType(rawType: string | null): CatalogItemType {
    return this.typeFilters.some((type) => type.value === rawType)
      ? rawType as CatalogItemType
      : 'BLANK';
  }
}

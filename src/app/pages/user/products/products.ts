import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { Category, ProductSummary } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { PageHeader } from '../../../shared/page-header/page-header';
import { ProductCard } from '../../../shared/product-card/product-card';

@Component({ selector: 'app-products-page', imports: [RouterLink, EmptyState, FeedbackBanner, PageHeader, ProductCard], templateUrl: './products.html', styleUrl: './products.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductsPage implements OnInit {
  private readonly api = inject(ShopApiService);
  private readonly route = inject(ActivatedRoute);
  readonly products = signal<ProductSummary[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (categories) => this.categories.set(categories) });
    this.route.queryParamMap.pipe(switchMap((params) => {
      const category = params.get('category');
      this.selectedCategory.set(category);
      this.loading.set(true); this.error.set(null);
      return this.api.getProducts(category ?? undefined, 0, 100).pipe(finalize(() => this.loading.set(false)));
    })).subscribe({ next: (products) => this.products.set(products), error: (error) => this.error.set(error.error?.message ?? 'Không thể tải danh sách sản phẩm.') });
  }
}

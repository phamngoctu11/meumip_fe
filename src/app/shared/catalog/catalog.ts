import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject, catchError, expand, map, reduce, startWith, switchMap, tap } from 'rxjs';
import { ProductSummary } from '../../core/models';
import { ShopApiService } from '../../core/shop-api.service';
import { StorefrontUiStore } from '../../core/storefront-ui.store';
import { ProductCard } from '../product-card/product-card';
import { ShopIcon } from '../shop-icon/shop-icon';

type SortOrder = 'newest' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-catalog',
  imports: [ProductCard, ShopIcon],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog {
  private readonly api = inject(ShopApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reload = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);
  readonly ui = inject(StorefrontUiStore);
  readonly allProducts = signal<ProductSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly type = signal('');
  readonly tag = signal('');
  readonly query = signal('');
  readonly sort = signal<SortOrder>('newest');
  readonly page = signal(1);
  readonly pageSize = 12;
  readonly types = [{ value: '', label: 'Tất cả' }, { value: 'BLANK', label: 'Phôi' }, { value: 'KIT', label: 'Bộ kit' }, { value: 'MATERIAL', label: 'Nguyên liệu' }];
  readonly tags = computed(() => [...new Set(this.allProducts().flatMap(product => product.tags))].sort((a, b) => a.localeCompare(b, 'vi')));
  readonly filtered = computed(() => {
    const query = this.normalize(this.query());
    const products = this.allProducts().filter(product =>
      (!this.type() || product.type === this.type()) &&
      (!this.tag() || product.tags.includes(this.tag())) &&
      (!query || this.normalize([product.name, product.typeLabel, ...product.tags].join(' ')).includes(query)));
    return products.sort((a, b) => this.sort() === 'price-asc' ? a.priceVnd - b.priceVnd || b.id - a.id : this.sort() === 'price-desc' ? b.priceVnd - a.priceVnd || b.id - a.id : b.id - a.id);
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));
  readonly products = computed(() => this.filtered().slice((this.currentPage() - 1) * this.pageSize, this.currentPage() * this.pageSize));
  readonly visiblePages = computed(() => {
    const start = Math.max(1, Math.min(this.currentPage() - 1, this.pageCount() - 2));
    return Array.from({ length: Math.min(3, this.pageCount()) }, (_, i) => start + i);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.type.set(this.types.some(type => type.value === params.get('type')) ? params.get('type')! : '');
      this.tag.set(params.get('tag') || '');
      this.query.set(params.get('q') || '');
      const sort = params.get('sort');
      this.sort.set(sort === 'price-asc' || sort === 'price-desc' ? sort : 'newest');
      const page = Number(params.get('page'));
      this.page.set(Number.isSafeInteger(page) && page > 0 ? page : 1);
    });
    // The existing API returns arrays, caps pages at 100, and has no sort/count
    // fields. Read all pages before sorting so prices are correct across pages.
    this.reload.pipe(
      startWith(undefined),
      tap(() => { this.loading.set(true); this.error.set(false); }),
      switchMap(() => this.api.getProducts(undefined, undefined, undefined, 0, 100).pipe(
        map(products => ({ products, page: 0 })),
        expand(batch => batch.products.length === 100
          ? this.api.getProducts(undefined, undefined, undefined, batch.page + 1, 100).pipe(map(products => ({ products, page: batch.page + 1 })))
          : EMPTY),
        reduce((products, batch) => [...products, ...batch.products], [] as ProductSummary[]),
        catchError(() => { this.error.set(true); this.loading.set(false); return EMPTY; }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(products => { this.allProducts.set(products); this.loading.set(false); });
  }

  retry(): void { this.reload.next(); }

  updateFilter(key: string, value: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [key]: value || null, page: null }, queryParamsHandling: 'merge', fragment: 'products-section', replaceUrl: true });
  }

  resetFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, fragment: 'products-section', replaceUrl: true });
  }

  goToPage(page: number, section: HTMLElement): void {
    if (page < 1 || page > this.pageCount()) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page === 1 ? null : page }, queryParamsHandling: 'merge', preserveFragment: true, replaceUrl: true }).then(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
  }
}

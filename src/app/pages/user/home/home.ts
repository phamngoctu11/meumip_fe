import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { CartStore } from '../../../core/cart.store';
import { demoProducts } from '../../../core/demo-products';
import { Category, HomeCombo, HomeSlide, ProductSummary, formatVnd } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ProductCard } from '../../../shared/product-card/product-card';

interface CategoryView extends Category { products: ProductSummary[]; }

const FALLBACK_SLIDES: HomeSlide[] = [
  { id: -1, eyebrow: 'Lovely handmade things', title: 'Một góc nhỏ đầy phép màu', description: 'Những món đồ bé xinh được làm chậm rãi và gói bằng thật nhiều yêu thương.', imageUrl: 'https://images.unsplash.com/photo-1594784054224-4e97266e6c68?auto=format&fit=crop&w=1600&q=85', linkLabel: 'Khám phá sản phẩm', linkUrl: '#products-section', sortOrder: 0, active: true },
];

@Component({ selector: 'app-home', imports: [RouterLink, ProductCard, FeedbackBanner, EmptyState], templateUrl: './home.html', styleUrl: './home.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class Home implements OnInit, OnDestroy {
  private readonly api = inject(ShopApiService);
  readonly cartStore = inject(CartStore);
  private slideTimer: ReturnType<typeof setInterval> | null = null;
  readonly slides = signal<HomeSlide[]>(FALLBACK_SLIDES);
  readonly activeSlide = signal(0);
  readonly categories = signal<CategoryView[]>([]);
  readonly combos = signal<HomeCombo[]>([]);
  readonly comboBlankSelections = signal<Record<number, Record<number, number | null>>>({});
  readonly addingComboId = signal<number | null>(null);
  readonly comboMessage = signal<string | null>(null);
  readonly loading = signal(true);
  readonly previewMode = signal(false);
  readonly formatVnd = formatVnd;

  ngOnInit(): void {
    forkJoin({
      slides: this.api.getHomeSlides().pipe(catchError(() => of(FALLBACK_SLIDES))),
      combos: this.api.getHomeCombos().pipe(catchError(() => of([] as HomeCombo[]))),
      categories: this.api.getCategories(),
    }).pipe(
      switchMap((home) => {
        if (!home.categories.length) return of({ ...home, categoryViews: [] as CategoryView[] });
        return forkJoin(home.categories.map((category) => this.api.getCategoryProducts(category.slug, 2).pipe(map((products) => ({ ...category, products }))))).pipe(map((categoryViews) => ({ ...home, categoryViews })));
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ slides, combos, categoryViews }) => {
        this.slides.set(slides.length ? slides : FALLBACK_SLIDES);
        this.combos.set(combos);
        this.categories.set(categoryViews);
        this.comboBlankSelections.set(Object.fromEntries(combos.map((combo) => [combo.id, Object.fromEntries(combo.products.map((product) => [product.id, null]))])));
        this.startSlider();
      },
      error: () => {
        this.previewMode.set(true);
        this.categories.set([{ id: -1, slug: 'preview', name: 'Sản phẩm mẫu', description: 'Dữ liệu xem trước', imageUrl: null, sortOrder: 0, active: true, products: demoProducts }]);
        this.startSlider();
      },
    });
  }

  ngOnDestroy(): void { if (this.slideTimer) clearInterval(this.slideTimer); }
  selectSlide(index: number): void { this.activeSlide.set(index); this.startSlider(); }
  previousSlide(): void { this.activeSlide.update((current) => (current - 1 + this.slides().length) % this.slides().length); this.startSlider(); }
  nextSlide(): void { this.activeSlide.update((current) => (current + 1) % this.slides().length); this.startSlider(); }
  isFragmentLink(url: string | null): boolean { return Boolean(url?.startsWith('#')); }
  comboTotal(combo: HomeCombo): number { return combo.products.reduce((total, product) => total + product.priceVnd, 0); }
  selectedComboBlank(comboId: number, productId: number): number | null { return this.comboBlankSelections()[comboId]?.[productId] ?? null; }
  selectComboBlank(comboId: number, productId: number, event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.comboBlankSelections.update((selections) => ({ ...selections, [comboId]: { ...selections[comboId], [productId]: Number.isFinite(value) && value > 0 ? value : null } }));
  }
  addCombo(combo: HomeCombo): void {
    const selections = combo.products.map((product) => ({ productId: product.id, productBlankId: this.selectedComboBlank(combo.id, product.id) }));
    if (selections.some((selection) => !selection.productBlankId)) { this.comboMessage.set('Bạn hãy chọn phôi cho từng sản phẩm trong combo trước nhé.'); return; }
    this.addingComboId.set(combo.id);
    this.comboMessage.set(null);
    this.cartStore.addCombo(combo.id, selections.map((selection) => ({ productId: selection.productId, productBlankId: selection.productBlankId! }))).pipe(finalize(() => this.addingComboId.set(null))).subscribe({ next: () => this.comboMessage.set(`Đã thêm combo “${combo.title}” vào giỏ.`), error: () => undefined });
  }
  private startSlider(): void { if (this.slideTimer) clearInterval(this.slideTimer); if (this.slides().length > 1) this.slideTimer = setInterval(() => this.activeSlide.update((current) => (current + 1) % this.slides().length), 6000); }
}

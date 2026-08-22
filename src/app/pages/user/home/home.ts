import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { CartStore } from '../../../core/cart.store';
import { ComboBlankSelection, HomeCombo, HomeSlide, ProductBlank, ProductSummary, formatVnd } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ProductCard } from '../../../shared/product-card/product-card';

const FALLBACK_SLIDES: HomeSlide[] = [
  {
    id: -1,
    eyebrow: 'Lovely handmade things',
    title: 'Một góc nhỏ đầy phép màu',
    description: 'Những món đồ bé xinh được làm chậm rãi và gói bằng thật nhiều yêu thương.',
    imageUrl: 'https://images.unsplash.com/photo-1594784054224-4e97266e6c68?auto=format&fit=crop&w=1600&q=85',
    linkLabel: 'Khám phá sản phẩm',
    linkUrl: '#products-section',
    sortOrder: 0,
    active: true,
  },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, FeedbackBanner, EmptyState],
  templateUrl: './home.html',
  styleUrls: ['./home.scss', './home-combo.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  private readonly api = inject(ShopApiService);
  readonly cartStore = inject(CartStore);
  private slideTimer: ReturnType<typeof setInterval> | null = null;

  readonly slides = signal<HomeSlide[]>(FALLBACK_SLIDES);
  readonly activeSlide = signal(0);
  readonly blankProducts = signal<ProductSummary[]>([]);
  readonly materialProducts = signal<ProductSummary[]>([]);
  readonly combos = signal<HomeCombo[]>([]);
  readonly selectedCombo = signal<HomeCombo | null>(null);
  readonly comboSelections = signal<Record<number, Record<number, number>>>({});
  readonly addingComboId = signal<number | null>(null);
  readonly comboMessage = signal<string | null>(null);
  readonly loading = signal(true);
  readonly previewMode = signal(false);
  readonly formatVnd = formatVnd;

  ngOnInit(): void {
    forkJoin({
      slides: this.api.getHomeSlides().pipe(catchError(() => of(FALLBACK_SLIDES))),
      blanks: this.api.getCatalog('BLANK', undefined, undefined, 0, 4).pipe(catchError(() => of([] as ProductSummary[]))),
      combos: this.api.getHomeCombos().pipe(catchError(() => of([] as HomeCombo[]))),
      materials: this.api.getCatalog('MATERIAL', undefined, undefined, 0, 4).pipe(catchError(() => of([] as ProductSummary[]))),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ slides, blanks, combos, materials }) => {
        this.slides.set(slides.length ? slides : FALLBACK_SLIDES);
        this.blankProducts.set(blanks);
        this.combos.set(combos);
        this.materialProducts.set(materials);
        this.comboSelections.set(Object.fromEntries(combos.map((combo) => [combo.id, {}])));
        this.startSlider();
      },
      error: () => {
        this.previewMode.set(true);
        this.startSlider();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
  }

  selectSlide(index: number): void {
    this.activeSlide.set(index);
    this.startSlider();
  }

  previousSlide(): void {
    this.activeSlide.update((current) => (current - 1 + this.slides().length) % this.slides().length);
    this.startSlider();
  }

  nextSlide(): void {
    this.activeSlide.update((current) => (current + 1) % this.slides().length);
    this.startSlider();
  }

  isFragmentLink(url: string | null): boolean {
    return Boolean(url?.startsWith('#'));
  }

  openCombo(combo: HomeCombo): void {
    this.comboMessage.set(null);
    this.comboSelections.update((all) => ({ ...all, [combo.id]: all[combo.id] ?? {} }));
    this.selectedCombo.set(combo);
  }

  closeCombo(): void {
    if (!this.addingComboId()) this.selectedCombo.set(null);
  }

  @HostListener('document:keydown.escape')
  closeComboWithEscape(): void {
    this.closeCombo();
  }

  selectedBlankIds(comboId: number): number[] {
    return this.comboSelectionRequest(comboId).flatMap((selection) =>
      Array.from({ length: selection.quantity }, () => selection.productBlankId),
    );
  }

  selectedBlankQuantities(comboId: number): Record<number, number> {
    return this.comboSelections()[comboId] ?? {};
  }

  selectedBlankQuantity(comboId: number, blankId: number): number {
    return this.selectedBlankQuantities(comboId)[blankId] ?? 0;
  }

  selectedBlankTotal(comboId: number): number {
    return Object.values(this.selectedBlankQuantities(comboId)).reduce((total, quantity) => total + quantity, 0);
  }

  selectedBlanks(combo: HomeCombo): ProductBlank[] {
    const quantities = this.selectedBlankQuantities(combo.id);
    return combo.blanks
      .filter((blank) => (quantities[blank.id] ?? 0) > 0)
      .map((blank) => ({ ...blank, quantity: quantities[blank.id] }));
  }

  isBlankSelected(comboId: number, blankId: number): boolean {
    return this.selectedBlankQuantity(comboId, blankId) > 0;
  }

  increaseComboBlank(combo: HomeCombo, blank: ProductBlank): void {
    const current = this.selectedBlankQuantities(combo.id);
    if (this.selectedBlankTotal(combo.id) >= combo.itemCount) {
      this.comboMessage.set(`Combo này chỉ được chọn ${combo.itemCount} phôi miễn phí.`);
      return;
    }

    this.comboMessage.set(null);
    this.comboSelections.update((all) => ({
      ...all,
      [combo.id]: { ...current, [blank.id]: (current[blank.id] ?? 0) + 1 },
    }));
  }

  decreaseComboBlank(combo: HomeCombo, blank: ProductBlank): void {
    const current = this.selectedBlankQuantities(combo.id);
    const quantity = current[blank.id] ?? 0;
    if (quantity <= 0) {
      return;
    }

    const next = { ...current };
    if (quantity === 1) {
      delete next[blank.id];
    } else {
      next[blank.id] = quantity - 1;
    }
    this.comboMessage.set(null);
    this.comboSelections.update((all) => ({ ...all, [combo.id]: next }));
  }

  comboReady(combo: HomeCombo): boolean {
    return this.selectedBlankTotal(combo.id) === combo.itemCount;
  }

  comboCover(combo: HomeCombo): string | null {
    return combo.imageUrl || combo.images?.[0]?.imageUrl || null;
  }

  blankCover(blank: ProductBlank): string {
    return blank.imageUrl || blank.images?.[0]?.imageUrl || '/images/product-placeholder.svg';
  }

  addCombo(combo: HomeCombo): void {
    const selections = this.comboSelectionRequest(combo.id);
    if (this.selectedBlankTotal(combo.id) !== combo.itemCount) {
      this.comboMessage.set(`Bạn hãy chọn đúng ${combo.itemCount} phôi miễn phí cho combo này.`);
      return;
    }

    this.addingComboId.set(combo.id);
    this.comboMessage.set(null);
    this.cartStore
      .addCombo(combo.id, selections, 1)
      .pipe(finalize(() => this.addingComboId.set(null)))
      .subscribe({
        next: () => {
          this.comboMessage.set(`Đã thêm combo “${combo.title}” vào giỏ.`);
          this.selectedCombo.set(null);
        },
        error: () => undefined,
      });
  }

  private comboSelectionRequest(comboId: number): ComboBlankSelection[] {
    return Object.entries(this.selectedBlankQuantities(comboId))
      .map(([productBlankId, quantity]) => ({ productBlankId: Number(productBlankId), quantity }))
      .filter((selection) => selection.productBlankId > 0 && selection.quantity > 0);
  }

  private startSlider(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.slides().length > 1) {
      this.slideTimer = setInterval(
        () => this.activeSlide.update((current) => (current + 1) % this.slides().length),
        6000,
      );
    }
  }
}

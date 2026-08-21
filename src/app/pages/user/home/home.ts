import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { demoProducts } from '../../../core/demo-products';
import { ProductSummary } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ProductCard } from '../../../shared/product-card/product-card';

interface HomeSlide { id: number; eyebrow: string; title: string; description: string; imageUrl: string; linkLabel: string; linkUrl: string; }
interface CategoryView { id: string; name: string; description: string; products: ProductSummary[]; }

const HOME_SLIDES: HomeSlide[] = [
  { id: 1, eyebrow: 'Lovely handmade things', title: 'Một góc nhỏ đầy phép màu', description: 'Những món đồ bé xinh được làm chậm rãi, chăm chút và gói bằng thật nhiều yêu thương.', imageUrl: 'https://images.unsplash.com/photo-1594784054224-4e97266e6c68?auto=format&fit=crop&w=1600&q=85', linkLabel: 'Khám phá sản phẩm', linkUrl: '#products-section' },
  { id: 2, eyebrow: 'Made just for you', title: 'Mỗi món quà là một câu chuyện', description: 'Chọn một món thật hợp với bạn hoặc nhắn meumip để đặt làm theo ý tưởng riêng.', imageUrl: 'https://images.unsplash.com/photo-1607457561901-e6ec3a6d16cf?auto=format&fit=crop&w=1600&q=85', linkLabel: 'Liên hệ với shop', linkUrl: '/contact' },
  { id: 3, eyebrow: 'New little friends', title: 'Bộ sưu tập mới đã ghé tiệm', description: 'Cùng gặp những người bạn mới nhất vừa được hoàn thiện tại góc nhỏ của meumip.', imageUrl: 'https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&w=1600&q=85', linkLabel: 'Xem ngay', linkUrl: '#products-section' },
];

@Component({ selector: 'app-home', imports: [RouterLink, ProductCard, FeedbackBanner, EmptyState], templateUrl: './home.html', styleUrl: './home.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class Home implements OnInit, OnDestroy {
  private readonly api = inject(ShopApiService);
  private slideTimer: ReturnType<typeof setInterval> | null = null;
  readonly slides = HOME_SLIDES;
  readonly activeSlide = signal(0);
  readonly products = signal<ProductSummary[]>([]);
  readonly loading = signal(true);
  readonly previewMode = signal(false);
  readonly categories = computed<CategoryView[]>(() => {
    const products = this.products();
    return [
      { id: 'new-arrivals', name: 'Mới về tiệm', description: 'Những sản phẩm mới nhất tại meumip', products: products.filter((_, index) => index % 3 === 0).slice(0, 2) },
      { id: 'handmade-charms', name: 'Charm thủ công', description: 'Những người bạn nhỏ để mang theo mỗi ngày', products: products.filter((_, index) => index % 3 === 1).slice(0, 2) },
      { id: 'collectibles', name: 'Góc sưu tầm', description: 'Món đồ xinh xắn dành cho góc riêng của bạn', products: products.filter((_, index) => index % 3 === 2).slice(0, 2) },
    ];
  });
  readonly combos = [
    { id: 'starter', label: 'Combo 01', title: 'Khởi đầu thật xinh', description: 'Một lựa chọn nhỏ gọn dành cho lần đầu ghé tiệm.', tone: 'pink' },
    { id: 'best-friends', label: 'Combo 02', title: 'Đôi bạn thân', description: 'Hai món đồ được kết hợp để cùng nhau kể một câu chuyện.', tone: 'lavender' },
    { id: 'collector', label: 'Combo 03', title: 'Góc sưu tầm', description: 'Một bộ quà đầy đủ hơn dành cho người mê những điều bé xinh.', tone: 'sage' },
  ];

  ngOnInit(): void {
    this.api.getProducts().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (products) => this.products.set(products),
      error: () => { this.products.set(demoProducts); this.previewMode.set(true); },
    });
    this.startSlider();
  }

  ngOnDestroy(): void { if (this.slideTimer) clearInterval(this.slideTimer); }
  selectSlide(index: number): void { this.activeSlide.set(index); this.startSlider(); }
  previousSlide(): void { this.activeSlide.update((current) => (current - 1 + this.slides.length) % this.slides.length); this.startSlider(); }
  nextSlide(): void { this.activeSlide.update((current) => (current + 1) % this.slides.length); this.startSlider(); }
  isFragmentLink(url: string): boolean { return url.startsWith('#'); }
  private startSlider(): void { if (this.slideTimer) clearInterval(this.slideTimer); this.slideTimer = setInterval(() => this.activeSlide.update((current) => (current + 1) % this.slides.length), 6000); }
}

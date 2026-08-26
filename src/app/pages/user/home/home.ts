import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { HomeSlide, ProductSummary } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { ProductCard } from '../../../shared/product-card/product-card';

const FALLBACK_SLIDE: HomeSlide = {
  id: 0,
  title: 'Tự tay làm nên điều dễ thương',
  eyebrow: 'meumip handmade',
  description: 'Khám phá phôi, bộ kit và nguyên liệu dành cho góc sáng tạo của bạn.',
  imageUrl: '/images/hero-slide-1.svg',
  linkLabel: 'Xem sản phẩm',
  linkUrl: '/products',
  sortOrder: 0,
  active: true,
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  private readonly api = inject(ShopApiService);
  private sliderTimer: ReturnType<typeof setInterval> | null = null;

  readonly slides = signal<HomeSlide[]>([FALLBACK_SLIDE]);
  readonly activeSlide = signal(0);
  readonly blankProducts = signal<ProductSummary[]>([]);
  readonly kitProducts = signal<ProductSummary[]>([]);
  readonly materialProducts = signal<ProductSummary[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      slides: this.api.getHomeSlides().pipe(catchError(() => of([] as HomeSlide[]))),
      blanks: this.api.getProducts('BLANK', undefined, undefined, 0, 4),
      kits: this.api.getProducts('KIT', undefined, undefined, 0, 4),
      materials: this.api.getProducts('MATERIAL', undefined, undefined, 0, 4),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ slides, blanks, kits, materials }) => {
          this.slides.set(slides.length ? slides : [FALLBACK_SLIDE]);
          this.blankProducts.set(blanks);
          this.kitProducts.set(kits);
          this.materialProducts.set(materials);
          this.startSlider();
        },
      });
  }

  ngOnDestroy(): void {
    if (this.sliderTimer) clearInterval(this.sliderTimer);
  }

  previousSlide(): void {
    const count = this.slides().length;
    this.activeSlide.update((index) => (index - 1 + count) % count);
  }

  nextSlide(): void {
    const count = this.slides().length;
    this.activeSlide.update((index) => (index + 1) % count);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
  }

  private startSlider(): void {
    if (this.slides().length < 2) return;
    this.sliderTimer = setInterval(() => this.nextSlide(), 7000);
  }
}

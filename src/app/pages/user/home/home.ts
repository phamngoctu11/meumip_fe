import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of, Subscription } from 'rxjs';
import { HomeSlide } from '../../../core/models';
import { ShopApiService } from '../../../core/shop-api.service';
import { StorefrontUiStore } from '../../../core/storefront-ui.store';
import { Catalog } from '../../../shared/catalog/catalog';
import { ShopIcon } from '../../../shared/shop-icon/shop-icon';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Catalog, ShopIcon, ImageFallbackDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  private readonly api = inject(ShopApiService);
  private timer: ReturnType<typeof setInterval> | null = null;
  private subscription?: Subscription;
  private touchStart: { x: number; y: number } | null = null;
  readonly ui = inject(StorefrontUiStore);
  readonly slides = signal<HomeSlide[]>([]);
  readonly activeSlide = signal(0);
  readonly paused = signal(false);
  readonly shaking = signal(false);

  ngOnInit(): void {
    this.subscription = this.api.getHomeSlides().pipe(catchError(() => of([] as HomeSlide[]))).subscribe(slides => {
      this.slides.set(slides.filter(slide => slide.active).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 5));
      if (this.slides().length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.timer = setInterval(() => { if (!this.paused() && !document.hidden) this.nextSlide(); }, 7000);
      }
    });
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); this.subscription?.unsubscribe(); }
  previousSlide(): void { this.activeSlide.update(index => (index - 1 + this.slides().length) % this.slides().length); }
  nextSlide(): void { this.activeSlide.update(index => (index + 1) % this.slides().length); }
  goToSlide(index: number): void { this.paused.set(true); this.activeSlide.set(index); }
  onTouchStart(event: TouchEvent): void { this.touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; this.paused.set(true); }
  onTouchEnd(event: TouchEvent): void {
    if (!this.touchStart || this.slides().length < 2) return;
    const dx = event.changedTouches[0].clientX - this.touchStart.x;
    const dy = event.changedTouches[0].clientY - this.touchStart.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? this.nextSlide() : this.previousSlide();
    this.touchStart = null;
  }
  openGift(): void { this.shaking.set(true); }
  finishGift(): void { this.shaking.set(false); this.ui.voucherOpen.set(true); }
  safeLink(url: string | null): string | null { return url && (/^\/(?!\/)/.test(url) || /^https?:\/\//i.test(url)) ? url : null; }
}

import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../../../../core/auth.store';
import { CartStore } from '../../../../core/cart.store';
import { STOREFRONT } from '../../../../core/storefront.config';
import { StorefrontUiStore } from '../../../../core/storefront-ui.store';
import { ThemeStore } from '../../../../core/theme.store';
import { StorefrontFooter } from '../../../../shared/storefront-footer/storefront-footer';
import { ShopDetails } from '../../../../shared/shop-details/shop-details';
import { ShopIcon } from '../../../../shared/shop-icon/shop-icon';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ShopDetails, ShopIcon, StorefrontFooter],
  templateUrl: './storefront-layout.html',
  styleUrl: './storefront-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontLayout {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  readonly themeStore = inject(ThemeStore);
  readonly ui = inject(StorefrontUiStore);
  readonly shop = STOREFRONT;
  readonly scrolled = signal(false);
  readonly drawerOpen = signal(false);
  readonly drawer = viewChild<ElementRef<HTMLDialogElement>>('drawer');
  readonly voucher = viewChild<ElementRef<HTMLDialogElement>>('voucher');
  readonly search = viewChild<ElementRef<HTMLDialogElement>>('search');
  readonly currentYear = new Date().getFullYear();

  constructor() {
    this.authStore.checkSession().pipe(takeUntilDestroyed()).subscribe(() => this.cartStore.load());
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => this.closeAll());
    effect(() => {
      const dialog = this.voucher()?.nativeElement;
      if (this.ui.voucherOpen() && dialog && !dialog.open) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      } else if (!this.ui.voucherOpen() && dialog?.open) {
        dialog.close();
      }
    });
    this.destroyRef.onDestroy(() => { document.body.style.overflow = ''; });
  }

  @HostListener('window:scroll') onScroll(): void { this.scrolled.set(window.scrollY > 40); }

  openDrawer(): void {
    this.drawerOpen.set(true);
    this.drawer()?.nativeElement.showModal();
    document.body.style.overflow = 'hidden';
  }

  openSearch(): void {
    this.search()?.nativeElement.showModal();
    document.body.style.overflow = 'hidden';
  }

  closeAll(): void {
    this.drawer()?.nativeElement.close();
    this.search()?.nativeElement.close();
    this.voucher()?.nativeElement.close();
    this.ui.voucherOpen.set(false);
    this.drawerOpen.set(false);
    document.body.style.overflow = '';
  }

  onDialogClose(event: Event): void {
    this.drawerOpen.set(this.drawer()?.nativeElement.open ?? false);
    if (event.target === this.voucher()?.nativeElement && !this.voucher()?.nativeElement.open) this.ui.voucherOpen.set(false);
    if (!this.ui.voucherOpen() && ![this.drawer(), this.voucher(), this.search()].some(ref => ref?.nativeElement.open)) document.body.style.overflow = '';
  }

  closeBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeAll();
  }

  searchProducts(event: Event, value: string): void {
    event.preventDefault();
    this.closeAll();
    void this.router.navigate(['/products'], { queryParams: { q: value.trim() || null } });
  }

  scrollTo(edge: 'top' | 'bottom'): void {
    window.scrollTo({ top: edge === 'top' ? 0 : document.documentElement.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  isAdmin(role: string | null | undefined): boolean { return role?.toUpperCase().replace('ROLE_', '') === 'ADMIN'; }
  logout(): void { this.authStore.logout(() => { this.cartStore.load(); this.closeAll(); void this.router.navigateByUrl('/login'); }); }
}

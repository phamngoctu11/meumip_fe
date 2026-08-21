import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../../core/auth.store';
import { CartStore } from '../../../../core/cart.store';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './storefront-layout.html',
  styleUrl: './storefront-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontLayout {
  private readonly router = inject(Router);
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  readonly accountMenuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  constructor() {
    this.authStore.checkSession();
    this.cartStore.load();
  }

  toggleAccountMenu(): void { this.accountMenuOpen.update((open) => !open); }
  closeAccountMenu(): void { this.accountMenuOpen.set(false); }
  isAdmin(role: string | null | undefined): boolean { return role?.toUpperCase().replace('ROLE_', '') === 'ADMIN'; }
  logout(): void { this.authStore.logout(() => { this.closeAccountMenu(); void this.router.navigateByUrl('/login'); }); }
}

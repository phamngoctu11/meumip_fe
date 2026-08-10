import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from './core/auth.store';
import { CartStore } from './core/cart.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  readonly menuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();
  readonly isAdminRoute = signal(this.router.url.startsWith('/admin'));

  constructor() {
    this.authStore.checkSession();
    this.cartStore.load();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.isAdminRoute.set(event.urlAfterRedirects.startsWith('/admin')));
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}

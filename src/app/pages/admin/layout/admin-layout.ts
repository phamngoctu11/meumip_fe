import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../core/auth.store';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.authStore.logout(() => void this.router.navigateByUrl('/login'));
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../../core/cart.store';
import { formatVnd } from '../../../core/models';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';
import { PageHeader } from '../../../shared/page-header/page-header';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, EmptyState, FeedbackBanner, ImageFallbackDirective, PageHeader],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  readonly cartStore = inject(CartStore);
  readonly formatVnd = formatVnd;

  reload(): void {
    this.cartStore.load();
  }

  removeItem(itemId: number): void {
    this.cartStore.remove(itemId).subscribe();
  }
}

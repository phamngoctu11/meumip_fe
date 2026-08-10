import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { demoProducts } from '../../core/demo-products';
import { ProductSummary } from '../../core/models';
import { ShopApiService } from '../../core/shop-api.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';
import { ProductCard } from '../../shared/product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, FeedbackBanner, EmptyState],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly api = inject(ShopApiService);

  readonly products = signal<ProductSummary[]>([]);
  readonly loading = signal(true);
  readonly previewMode = signal(false);

  ngOnInit(): void {
    this.api
      .getProducts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (products) => this.products.set(products),
        error: () => {
          this.products.set(demoProducts);
          this.previewMode.set(true);
        },
      });
  }
}

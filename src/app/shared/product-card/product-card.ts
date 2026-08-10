import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatVnd, ProductSummary } from '../../core/models';
import { ImageFallbackDirective } from '../image-fallback.directive';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, ImageFallbackDirective],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<ProductSummary>();
  readonly animationDelay = input(0);
  readonly formatVnd = formatVnd;
}

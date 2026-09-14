import { ChangeDetectionStrategy, Component } from '@angular/core';
import { STOREFRONT } from '../../core/storefront.config';
import { ShopDetails } from '../shop-details/shop-details';
@Component({
  selector: 'app-storefront-footer',
  imports: [ShopDetails],
  templateUrl: './storefront-footer.html',
  styleUrl: './storefront-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontFooter {
  readonly shop = STOREFRONT;
  readonly currentYear = new Date().getFullYear();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STOREFRONT } from '../../core/storefront.config';
import { ShopIcon } from '../shop-icon/shop-icon';

@Component({
  selector: 'app-shop-details',
  imports: [RouterLink, ShopIcon],
  templateUrl: './shop-details.html',
  styleUrl: './shop-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopDetails {
  readonly compact = input(false);
  readonly shop = STOREFRONT;
}

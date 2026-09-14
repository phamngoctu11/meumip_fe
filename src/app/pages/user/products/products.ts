import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Catalog } from '../../../shared/catalog/catalog';

@Component({
  selector: 'app-products-page',
  imports: [Catalog],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {}

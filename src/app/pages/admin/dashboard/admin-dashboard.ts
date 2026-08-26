import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { formatVnd, Order, ProductDetail } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { orderStatusLabel } from '../admin.utils';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, FeedbackBanner],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly products = signal<ProductDetail[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly clearingCache = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly formatVnd = formatVnd;
  readonly orderStatusLabel = orderStatusLabel;

  readonly kitProducts = computed(
    () => this.products().filter((product) => product.type === 'KIT').length,
  );
  readonly pendingOrders = computed(
    () =>
      this.orders().filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.orderStatus)).length,
  );
  readonly paidRevenue = computed(() =>
    this.orders()
      .filter((order) => order.paymentStatus === 'PAID')
      .reduce((sum, order) => sum + order.totalVnd, 0),
  );
  readonly awaitingPaymentConfirmation = computed(
    () => this.orders().filter((order) => order.paymentStatus === 'WAITING_CONFIRMATION').length,
  );

  ngOnInit(): void {
    this.load();
  }
  clearCache(): void {
    if (this.clearingCache()) return;

    this.clearingCache.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api
      .clearCache()
      .pipe(finalize(() => this.clearingCache.set(false)))
      .subscribe({
        next: () => this.success.set('Đã xóa bộ nhớ đệm.'),
        error: (error) =>
          this.error.set(error.error?.message ?? 'Không thể xóa bộ nhớ đệm. Vui lòng thử lại.'),
      });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ products: this.api.listProducts(), orders: this.api.listOrders() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ products, orders }) => {
          this.products.set(products);
          this.orders.set(orders);
        },
        error: () => this.error.set('Chưa thể tải dữ liệu quản trị. Hãy kiểm tra backend và quyền ADMIN.'),
      });
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { formatVnd, Order } from '../../core/models';
import { orderStatusLabel, paymentStatusLabel } from '../../core/order-status.utils';
import { ShopApiService } from '../../core/shop-api.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-orders',
  imports: [DatePipe, RouterLink, EmptyState, FeedbackBanner, PageHeader],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly api = inject(ShopApiService);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formatVnd = formatVnd;
  readonly orderStatusLabel = orderStatusLabel;
  readonly paymentStatusLabel = paymentStatusLabel;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getMyOrders()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Chưa thể tải đơn hàng của bạn.'),
      });
  }
}

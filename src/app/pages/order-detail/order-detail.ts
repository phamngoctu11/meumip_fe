import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { formatVnd, Order } from '../../core/models';
import { orderStatusLabel, paymentStatusLabel } from '../../core/order-status.utils';
import { ShopApiService } from '../../core/shop-api.service';
import { FeedbackBanner } from '../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../shared/image-fallback.directive';

@Component({
  selector: 'app-order-detail',
  imports: [DatePipe, RouterLink, FeedbackBanner, ImageFallbackDirective],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage implements OnInit {
  private readonly api = inject(ShopApiService);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formatVnd = formatVnd;
  readonly orderStatusLabel = orderStatusLabel;
  readonly paymentStatusLabel = paymentStatusLabel;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const orderCode = this.route.snapshot.paramMap.get('orderCode');
    if (!orderCode) {
      this.loading.set(false);
      this.error.set('Mã đơn hàng không hợp lệ.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getOrder(orderCode)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (order) => this.order.set(order),
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Không thể tải chi tiết đơn hàng.'),
      });
  }
}

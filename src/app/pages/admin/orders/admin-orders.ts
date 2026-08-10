import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { formatVnd, Order } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ORDER_STATUSES, orderStatusLabel, paymentStatusLabel } from '../admin.utils';

@Component({
  selector: 'app-admin-orders',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, FeedbackBanner],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrders implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly orderStatuses = ORDER_STATUSES;
  readonly formatVnd = formatVnd;
  readonly orderStatusLabel = orderStatusLabel;
  readonly paymentStatusLabel = paymentStatusLabel;

  readonly filterForm = this.formBuilder.nonNullable.group({
    search: [''],
    orderStatus: ['ALL'],
    paymentStatus: ['ALL'],
  });
  readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );
  readonly visibleOrders = computed(() => {
    const { search, orderStatus, paymentStatus } = this.filters();
    const term = (search ?? '').trim().toLowerCase();
    return this.orders().filter(
      (order) =>
        (orderStatus === 'ALL' || order.orderStatus === orderStatus) &&
        (paymentStatus === 'ALL' || order.paymentStatus === paymentStatus) &&
        (!term ||
          order.orderCode.toLowerCase().includes(term) ||
          order.recipientName.toLowerCase().includes(term) ||
          order.customerEmail.toLowerCase().includes(term) ||
          order.recipientPhone.includes(term)),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listOrders()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (orders) => this.orders.set(orders),
        error: () => this.error.set('Chưa thể tải danh sách đơn hàng. Vui lòng thử lại.'),
      });
  }
}

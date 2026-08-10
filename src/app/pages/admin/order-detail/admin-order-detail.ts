import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { formatVnd, Order } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';
import { ORDER_STATUSES, orderStatusLabel, paymentStatusLabel } from '../admin.utils';

@Component({
  selector: 'app-admin-order-detail',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, FeedbackBanner, ImageFallbackDirective],
  templateUrl: './admin-order-detail.html',
  styleUrl: './admin-order-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderDetail implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly savingStatus = signal(false);
  readonly confirmingPayment = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly orderStatuses = ORDER_STATUSES;
  readonly formatVnd = formatVnd;
  readonly orderStatusLabel = orderStatusLabel;
  readonly paymentStatusLabel = paymentStatusLabel;

  readonly statusForm = this.formBuilder.nonNullable.group({
    status: ['NEW', Validators.required],
    note: ['', Validators.maxLength(500)],
  });
  readonly paymentForm = this.formBuilder.nonNullable.group({
    providerTransactionId: ['', Validators.maxLength(255)],
    providerPayload: ['', Validators.maxLength(2000)],
  });

  ngOnInit(): void {
    this.load();
  }

  load(showLoader = true): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(orderId) || orderId < 1) {
      this.loading.set(false);
      this.error.set('Mã đơn hàng không hợp lệ.');
      return;
    }

    if (showLoader) {
      this.loading.set(true);
    }
    this.api
      .getOrder(orderId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.statusForm.patchValue({ status: order.orderStatus });
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Không thể tải chi tiết đơn hàng.'),
      });
  }

  updateStatus(): void {
    const order = this.order();
    if (!order || this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.savingStatus.set(true);
    this.clearFeedback();
    this.api
      .changeOrderStatus(order.id, this.statusForm.getRawValue())
      .pipe(finalize(() => this.savingStatus.set(false)))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.success.set('Đã cập nhật trạng thái đơn hàng.');
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Không thể cập nhật trạng thái đơn hàng.'),
      });
  }

  confirmPayment(): void {
    const order = this.order();
    if (!order || this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (!window.confirm(`Xác nhận đã nhận thanh toán cho đơn #${order.orderCode}?`)) {
      return;
    }

    this.confirmingPayment.set(true);
    this.clearFeedback();
    this.api
      .confirmPayment(order.id, this.paymentForm.getRawValue())
      .pipe(
        switchMap(() => this.api.getOrder(order.id)),
        finalize(() => this.confirmingPayment.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.statusForm.patchValue({ status: updated.orderStatus });
          this.success.set('Đã xác nhận thanh toán và đồng bộ trạng thái đơn hàng.');
        },
        error: (error: HttpErrorResponse) =>
          this.error.set(error.error?.message ?? 'Không thể xác nhận thanh toán.'),
      });
  }

  private clearFeedback(): void {
    this.error.set(null);
    this.success.set(null);
  }
}

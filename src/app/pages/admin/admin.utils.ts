export const PRODUCT_STATUSES = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'ACTIVE', label: 'Đang bán' },
  { value: 'SOLD_OUT', label: 'Hết hàng' },
  { value: 'HIDDEN', label: 'Đã ẩn' },
] as const;

export function productStatusLabel(status: string): string {
  return PRODUCT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export { ORDER_STATUSES, orderStatusLabel, paymentStatusLabel } from '../../core/order-status.utils';

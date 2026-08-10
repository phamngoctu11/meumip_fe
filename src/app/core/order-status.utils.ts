export const ORDER_STATUSES = [
  { value: 'NEW', label: 'Đơn mới' },
  { value: 'AWAITING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'MAKING', label: 'Đang làm' },
  { value: 'READY_TO_SHIP', label: 'Chờ giao hàng' },
  { value: 'SHIPPED', label: 'Đang giao' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function paymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: 'Chưa thanh toán',
    WAITING_CONFIRMATION: 'Chờ xác nhận',
    PAID: 'Đã thanh toán',
    FAILED: 'Thất bại',
    REFUNDED: 'Đã hoàn tiền',
    PENDING: 'Đang xử lý',
    CONFIRMED: 'Đã xác nhận',
    EXPIRED: 'Đã hết hạn',
  };
  return labels[status] ?? status;
}

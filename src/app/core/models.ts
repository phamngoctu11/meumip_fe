export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  priceVnd: number;
  status: string;
  primaryImageUrl: string | null;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  primaryImage: boolean;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN';

export interface ProductImageRequest {
  imageUrl: string;
  altText: string;
  sortOrder: number;
  primaryImage: boolean;
}

export interface ProductUpsertRequest {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  priceVnd: number;
  status: ProductStatus;
  madeToOrder: boolean;
  productionMinDays: number | null;
  productionMaxDays: number | null;
  shippingNote: string;
  sizeNote: string;
  materialNote: string;
  stockQuantity: number | null;
  sortOrder: number;
  images: ProductImageRequest[];
}

export interface ImageUploadResponse {
  publicId: string;
  imageUrl: string;
  format: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  madeToOrder: boolean;
  productionMinDays: number | null;
  productionMaxDays: number | null;
  shippingNote: string | null;
  sizeNote: string | null;
  materialNote: string | null;
  stockQuantity: number | null;
  sortOrder: number;
  images: ProductImage[];
}

export interface CartItem {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

export interface Cart {
  id: number | null;
  sessionId: string | null;
  items: CartItem[];
  subtotalVnd: number;
  itemCount: number;
}

export interface CheckoutRequest {
  cartSessionId: string | null;
  email: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  postalCode: string;
  customerNote: string;
  saveAddress: boolean;
}

export interface OrderItem {
  id: number;
  productName: string;
  productSlug: string | null;
  productImageUrl: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

export interface Order {
  id: number;
  orderCode: string;
  customerEmail: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subtotalVnd: number;
  shippingFeeVnd: number;
  discountVnd: number;
  totalVnd: number;
  paymentStatus: string;
  orderStatus: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  status: string;
  amountVnd: number;
  bankCode: string;
  bankBin: string | null;
  bankAccountNumber: string;
  bankAccountName: string;
  transferContent: string;
  qrImageUrl: string | null;
}

export interface CheckoutResponse {
  order: Order;
  payment: Payment;
}

export interface ChangeOrderStatusRequest {
  status: string;
  note: string;
}

export interface ConfirmPaymentRequest {
  providerTransactionId: string;
  providerPayload: string;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export interface ShopUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}

export interface ApiErrorBody {
  success: boolean;
  status: number;
  message: string;
  data: Record<string, string> | null;
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

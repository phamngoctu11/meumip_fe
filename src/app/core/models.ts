export type CatalogItemType = 'BLANK' | 'KIT' | 'MATERIAL';

export interface ProductSummary {
  id: number;
  type: CatalogItemType;
  typeLabel: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  priceVnd: number;
  status: string;
  primaryImageUrl: string | null;
  images: ProductImage[];
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  blankSize: string | null;
  blankShape: string | null;
  includedBlankCount: number | null;
  selectionRequired: boolean;
  tags: string[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
}

export interface ProductBlank {
  id: number;
  slug: string | null;
  name: string;
  size: string;
  imageUrl: string;
  images: ProductImage[];
  priceVnd: number;
  quantity?: number | null;
  sortOrder: number;
  active: boolean;
}

export interface HomeSlide {
  id: number;
  title: string;
  eyebrow: string | null;
  description: string | null;
  imageUrl: string;
  linkLabel: string | null;
  linkUrl: string | null;
  sortOrder: number;
  active: boolean;
}

export interface HomeCombo {
  id: number;
  code: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  images: ProductImage[];
  itemCount: number;
  priceVnd: number;
  priceNote: string | null;
  components: KitComponent[];
  tags: string[];
  sortOrder: number;
  active: boolean;
  blanks: ProductBlank[];
}

export interface ComboBlankSelection {
  productBlankId: number;
  quantity: number;
}

export interface KitComponent {
  id: number | null;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
  sortOrder: number;
}

export interface KitComponentRequest {
  name: string;
  quantity: number;
  unit: string;
  note: string;
  sortOrder: number;
}

export interface CategoryUpsertRequest {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
}

export interface HomeSlideUpsertRequest {
  title: string;
  eyebrow: string;
  description: string;
  imageUrl: string;
  linkLabel: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
}

export interface HomeComboUpsertRequest {
  code: string;
  title: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  priceVnd: number;
  priceNote: string;
  images?: ProductImageRequest[];
  components?: KitComponentRequest[];
  tags?: string[];
  sortOrder: number;
  active: boolean;
}

export interface ProductBlankUpsertRequest {
  slug?: string;
  name: string;
  size: string;
  imageUrl: string;
  priceVnd?: number;
  sortOrder: number;
  active: boolean;
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
  type: CatalogItemType;
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
  blankSize: string;
  blankShape: string;
  includedBlankCount: number | null;
  selectionRequired: boolean;
  selectionNote: string;
  categoryId: number | null;
  categorySlug: string | null;
  stockQuantity: number | null;
  sortOrder: number;
  images: ProductImageRequest[];
  tags: string[];
  kitComponents: KitComponentRequest[];
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
  selectionNote: string | null;
  stockQuantity: number | null;
  sortOrder: number;
  kitComponents: KitComponent[];
  blanks: ProductBlank[];
}

export interface CartItem {
  id: number;
  itemType: CatalogItemType;
  itemTypeLabel: string;
  productId: number;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  productBlankId: number | null;
  productBlankName: string | null;
  productBlankSize: string | null;
  productBlankImageUrl: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
  selectedBlanks: ProductBlank[];
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
  itemType: CatalogItemType;
  itemTypeLabel: string;
  productName: string;
  productSlug: string | null;
  productImageUrl: string | null;
  productBlankId: number | null;
  blankName: string | null;
  blankSize: string | null;
  blankImageUrl: string | null;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
  selectedBlanks: ProductBlank[];
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

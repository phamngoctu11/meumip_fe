import { ProductDetail, ProductSummary } from './models';

const mikuImage =
  'https://assets.bigcartel.com/product_images/428310705/quality_restoration_20260726144342290.jpeg?auto=format&fit=max&w=960';
const tetoImage =
  'https://assets.bigcartel.com/product_images/428310699/quality_restoration_20260726144418711.jpeg?auto=format&fit=max&w=960';

export const demoProducts: ProductSummary[] = [
  {
    id: 1,
    slug: 'miku',
    name: 'miku',
    shortDescription: 'Móc khóa fanart làm thủ công, mỗi bé có một chút khác biệt.',
    priceVnd: 1_200_000,
    status: 'ACTIVE',
    primaryImageUrl: mikuImage,
    categoryId: null,
    categorySlug: null,
    categoryName: null,
  },
  {
    id: 2,
    slug: 'teto',
    name: 'teto',
    shortDescription: 'Một chiếc charm nhỏ xíu, được hoàn thiện và đóng gói bằng tay.',
    priceVnd: 1_200_000,
    status: 'ACTIVE',
    primaryImageUrl: tetoImage,
    categoryId: null,
    categorySlug: null,
    categoryName: null,
  },
];

export const demoProductDetails: Record<string, ProductDetail> = {
  miku: {
    ...demoProducts[0],
    description:
      'Mỗi chiếc móc khóa được tạo hình, tô màu và hoàn thiện thủ công. Vì vậy những khác biệt nhỏ là nét riêng của từng sản phẩm.',
    madeToOrder: true,
    productionMinDays: 10,
    productionMaxDays: 14,
    shippingNote: 'Đơn sẽ được đóng gói cẩn thận sau khi hoàn thiện.',
    sizeNote: 'Khoảng 5–6 cm',
    materialNote: 'Đất sét và resin',
    stockQuantity: null,
    sortOrder: 0,
    images: [
      { id: 1, imageUrl: mikuImage, altText: 'Móc khóa fanart Miku', sortOrder: 0, primaryImage: true },
    ],
    blanks: [{ id: 1, name: 'Phôi tiêu chuẩn', size: '5–6 cm', imageUrl: mikuImage, sortOrder: 0, active: true }],
  },
  teto: {
    ...demoProducts[1],
    description:
      'Một chiếc charm fanart nho nhỏ dành cho túi xách hoặc góc sưu tầm. Sản phẩm được làm chậm rãi bằng tay tại meumip.',
    madeToOrder: true,
    productionMinDays: 10,
    productionMaxDays: 14,
    shippingNote: 'Đơn sẽ được đóng gói cẩn thận sau khi hoàn thiện.',
    sizeNote: 'Khoảng 5–6 cm',
    materialNote: 'Đất sét và resin',
    stockQuantity: null,
    sortOrder: 1,
    images: [
      { id: 2, imageUrl: tetoImage, altText: 'Móc khóa fanart Teto', sortOrder: 0, primaryImage: true },
    ],
    blanks: [{ id: 1, name: 'Phôi tiêu chuẩn', size: '5–6 cm', imageUrl: tetoImage, sortOrder: 0, active: true }],
  },
};

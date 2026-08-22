import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import {
  CatalogItemType,
  Category,
  ProductDetail,
  ProductImage,
  ProductStatus,
  ProductUpsertRequest,
} from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';
import { PRODUCT_STATUSES } from '../admin.utils';

type ProductImageForm = FormGroup<{
  imageUrl: FormControl<string>;
  altText: FormControl<string>;
  sortOrder: FormControl<number>;
  primaryImage: FormControl<boolean>;
}>;

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink, FeedbackBanner, ImageFallbackDirective],
  templateUrl: './admin-product-form.html',
  styleUrl: './admin-product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly productId = this.parseProductId();
  readonly isEdit = this.productId !== null;
  readonly statuses = PRODUCT_STATUSES;
  readonly itemTypes: Array<{ value: CatalogItemType; label: string }> = [
    { value: 'BLANK', label: 'Phôi lẻ' },
    { value: 'KIT', label: 'Combo Kit' },
    { value: 'MATERIAL', label: 'Nguyên liệu / món bán lẻ' },
  ];
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly images = new FormArray<ProductImageForm>([]);

  readonly productForm = this.formBuilder.group({
    type: this.formBuilder.nonNullable.control<CatalogItemType>('MATERIAL', Validators.required),
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
    slug: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
    shortDescription: this.formBuilder.nonNullable.control('', Validators.maxLength(255)),
    description: this.formBuilder.nonNullable.control(''),
    categoryId: this.formBuilder.control<number | null>(null),
    categorySlug: this.formBuilder.control<string | null>(null),
    priceVnd: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    status: this.formBuilder.nonNullable.control<ProductStatus>('DRAFT', Validators.required),
    madeToOrder: this.formBuilder.nonNullable.control(true),
    productionMinDays: this.formBuilder.control<number | null>(null, Validators.min(0)),
    productionMaxDays: this.formBuilder.control<number | null>(null, Validators.min(0)),
    shippingNote: this.formBuilder.nonNullable.control('', Validators.maxLength(255)),
    sizeNote: this.formBuilder.nonNullable.control('', Validators.maxLength(100)),
    materialNote: this.formBuilder.nonNullable.control('', Validators.maxLength(255)),
    blankSize: this.formBuilder.nonNullable.control('', Validators.maxLength(100)),
    blankShape: this.formBuilder.nonNullable.control('', Validators.maxLength(120)),
    includedBlankCount: this.formBuilder.control<number | null>(null, Validators.min(0)),
    selectionRequired: this.formBuilder.nonNullable.control(false),
    selectionNote: this.formBuilder.nonNullable.control('', Validators.maxLength(255)),
    tagsText: this.formBuilder.nonNullable.control('', Validators.maxLength(255)),
    stockQuantity: this.formBuilder.control<number | null>(null, Validators.min(0)),
    sortOrder: this.formBuilder.nonNullable.control(0),
    images: this.images,
  });

  ngOnInit(): void {
    if (!this.isEdit || this.productId === null) {
      this.api.listCategories().subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.error.set('Không thể tải danh mục sản phẩm.'),
      });
      return;
    }

    forkJoin({ categories: this.api.listCategories(), product: this.api.getProduct(this.productId) })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ categories, product }) => {
          this.categories.set(categories);
          this.fillForm(product);
        },
        error: () => this.error.set('Không thể tải thông tin sản phẩm.'),
      });
  }

  generateSlug(): void {
    const slugControl = this.productForm.controls.slug;
    if (this.isEdit || slugControl.dirty || slugControl.value) {
      return;
    }
    slugControl.setValue(this.slugify(this.productForm.controls.name.value));
  }

  addImage(image?: Partial<ProductImage>): void {
    const index = this.images.length;
    this.images.push(
      this.formBuilder.nonNullable.group({
        imageUrl: [image?.imageUrl ?? '', [Validators.required, Validators.maxLength(700)]],
        altText: [image?.altText ?? '', Validators.maxLength(160)],
        sortOrder: [image?.sortOrder ?? index],
        primaryImage: [image?.primaryImage ?? index === 0],
      }),
    );
  }

  removeImage(index: number): void {
    const wasPrimary = this.images.at(index).controls.primaryImage.value;
    this.images.removeAt(index);
    if (wasPrimary && this.images.length) {
      this.setPrimary(0);
    }
  }

  setPrimary(index: number): void {
    this.images.controls.forEach((image, imageIndex) =>
      image.controls.primaryImage.setValue(imageIndex === index),
    );
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.error.set('Chỉ có thể tải lên file hình ảnh.');
      input.value = '';
      return;
    }

    this.uploading.set(true);
    this.error.set(null);
    this.api
      .uploadImage(file)
      .pipe(finalize(() => {
        this.uploading.set(false);
        input.value = '';
      }))
      .subscribe({
        next: (image) => this.addImage({ imageUrl: image.imageUrl, altText: file.name }),
        error: () => this.error.set('Không thể tải ảnh. Hãy kiểm tra cấu hình Cloudinary/backend.'),
      });
  }

  submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.error.set('Bạn kiểm tra lại các trường bắt buộc và ảnh sản phẩm nhé.');
      return;
    }

    const value = this.productForm.getRawValue();
    const request: ProductUpsertRequest = {
      type: 'MATERIAL',
      slug: value.slug.trim().toLowerCase(),
      name: value.name.trim(),
      shortDescription: value.shortDescription.trim(),
      description: value.description.trim(),
      priceVnd: value.priceVnd,
      status: value.status,
      madeToOrder: value.madeToOrder,
      productionMinDays: value.productionMinDays,
      productionMaxDays: value.productionMaxDays,
      shippingNote: value.shippingNote.trim(),
      sizeNote: value.sizeNote.trim(),
      materialNote: value.materialNote.trim(),
      blankSize: value.blankSize.trim(),
      blankShape: value.blankShape.trim(),
      includedBlankCount: value.includedBlankCount,
      selectionRequired: value.selectionRequired,
      selectionNote: value.selectionNote.trim(),
      categoryId: value.categoryId,
      categorySlug: value.categorySlug,
      stockQuantity: value.stockQuantity,
      sortOrder: value.sortOrder,
      images: value.images.map((image, index) => ({ ...image, sortOrder: image.sortOrder ?? index })),
      tags: this.parseTags(value.tagsText),
      kitComponents: [],
    };

    this.saving.set(true);
    this.error.set(null);
    const operation =
      this.isEdit && this.productId !== null
        ? this.api.updateProduct(this.productId, request)
        : this.api.createProduct(request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigate(['/admin/products']),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu sản phẩm.'),
    });
  }

  private fillForm(product: ProductDetail): void {
    this.productForm.patchValue({
      name: product.name,
      type: product.type,
      slug: product.slug,
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId,
      categorySlug: product.categorySlug,
      priceVnd: product.priceVnd,
      status: product.status as ProductStatus,
      madeToOrder: product.madeToOrder,
      productionMinDays: product.productionMinDays,
      productionMaxDays: product.productionMaxDays,
      shippingNote: product.shippingNote ?? '',
      sizeNote: product.sizeNote ?? '',
      materialNote: product.materialNote ?? '',
      blankSize: product.blankSize ?? '',
      blankShape: product.blankShape ?? '',
      includedBlankCount: product.includedBlankCount,
      selectionRequired: product.selectionRequired,
      selectionNote: product.selectionNote ?? '',
      tagsText: product.tags.join(', '),
      stockQuantity: product.stockQuantity,
      sortOrder: product.sortOrder,
    });
    this.images.clear();
    product.images.forEach((image) => this.addImage(image));
  }

  private parseProductId(): number | null {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (!rawId) {
      return null;
    }
    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseTags(value: string): string[] {
    return value
      .split(/[,\s#]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

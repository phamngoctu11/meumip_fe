import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import {
  CatalogItemType,
  KitComponent,
  ProductDetail,
  ProductImage,
  ProductUpsertRequest,
} from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

type ProductImageForm = FormGroup<{
  imageUrl: FormControl<string>;
  altText: FormControl<string>;
  primaryImage: FormControl<boolean>;
}>;

type KitComponentForm = FormGroup<{
  name: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<string>;
  note: FormControl<string>;
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
  readonly itemTypes: Array<{ value: CatalogItemType; label: string }> = [
    { value: 'BLANK', label: 'Phôi' },
    { value: 'KIT', label: 'Bộ kit' },
    { value: 'MATERIAL', label: 'Nguyên liệu' },
  ];
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly images = new FormArray<ProductImageForm>([]);
  readonly kitComponents = new FormArray<KitComponentForm>([]);

  readonly productForm = this.formBuilder.group({
    type: this.formBuilder.nonNullable.control<CatalogItemType>('MATERIAL', Validators.required),
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(160)]),
    description: this.formBuilder.nonNullable.control(''),
    priceVnd: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    tagsText: this.formBuilder.nonNullable.control('', Validators.maxLength(500)),
    images: this.images,
    kitComponents: this.kitComponents,
  });

  ngOnInit(): void {
    if (!this.isEdit || this.productId === null) return;
    this.api
      .getProduct(this.productId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => this.fillForm(product),
        error: () => this.error.set('Không thể tải thông tin sản phẩm.'),
      });
  }

  addImage(image?: Partial<ProductImage>): void {
    const index = this.images.length;
    this.images.push(
      this.formBuilder.nonNullable.group({
        imageUrl: [image?.imageUrl ?? '', [Validators.required, Validators.maxLength(500)]],
        altText: [image?.altText ?? '', Validators.maxLength(160)],
        primaryImage: [image?.primaryImage ?? index === 0],
      }),
    );
  }

  removeImage(index: number): void {
    const wasPrimary = this.images.at(index).controls.primaryImage.value;
    this.images.removeAt(index);
    if (wasPrimary && this.images.length) this.setPrimary(0);
  }

  setPrimary(index: number): void {
    this.images.controls.forEach((image, imageIndex) =>
      image.controls.primaryImage.setValue(imageIndex === index),
    );
  }

  addKitComponent(component?: Partial<KitComponent>): void {
    this.kitComponents.push(
      this.formBuilder.nonNullable.group({
        name: [component?.name ?? '', [Validators.required, Validators.maxLength(160)]],
        quantity: [component?.quantity ?? 1, [Validators.required, Validators.min(1)]],
        unit: [component?.unit ?? '', Validators.maxLength(40)],
        note: [component?.note ?? '', Validators.maxLength(255)],
      }),
    );
  }

  removeKitComponent(index: number): void {
    this.kitComponents.removeAt(index);
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
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
        error: () => this.error.set('Không thể tải ảnh. Hãy kiểm tra cấu hình lưu trữ ảnh.'),
      });
  }

  submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.error.set('Vui lòng kiểm tra lại các trường bắt buộc.');
      return;
    }

    const value = this.productForm.getRawValue();
    const request: ProductUpsertRequest = {
      type: value.type,
      name: value.name.trim(),
      description: value.description.trim(),
      priceVnd: value.priceVnd,
      images: value.images.map((image, index) => ({
        imageUrl: image.imageUrl.trim(),
        altText: image.altText.trim(),
        sortOrder: index,
        primaryImage: image.primaryImage,
      })),
      tags: this.parseTags(value.tagsText),
      kitComponents: value.type === 'KIT'
        ? value.kitComponents.map((component, index) => ({
            name: component.name.trim(),
            quantity: component.quantity,
            unit: component.unit.trim(),
            note: component.note.trim(),
            sortOrder: index,
          }))
        : [],
    };

    this.saving.set(true);
    this.error.set(null);
    const operation = this.isEdit && this.productId !== null
      ? this.api.updateProduct(this.productId, request)
      : this.api.createProduct(request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigate(['/admin/products']),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu sản phẩm.'),
    });
  }

  private fillForm(product: ProductDetail): void {
    this.productForm.patchValue({
      type: product.type,
      name: product.name,
      description: product.description ?? '',
      priceVnd: product.priceVnd,
      tagsText: product.tags.join(', '),
    });
    this.images.clear();
    product.images.forEach((image) => this.addImage(image));
    this.kitComponents.clear();
    product.kitComponents.forEach((component) => this.addKitComponent(component));
  }

  private parseProductId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  private parseTags(value: string): string[] {
    return [...new Set(value.split(/[,#]+/).map((tag) => tag.trim()).filter(Boolean))];
  }
}

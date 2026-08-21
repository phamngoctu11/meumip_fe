import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { ProductBlank, ProductBlankUpsertRequest } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

@Component({
  selector: 'app-admin-product-blanks',
  imports: [ReactiveFormsModule, FeedbackBanner, ImageFallbackDirective],
  templateUrl: './admin-product-blanks.html',
  styleUrl: './admin-product-blanks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductBlanks implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly blanks = signal<ProductBlank[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly blankForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    size: ['', [Validators.required, Validators.maxLength(100)]],
    imageUrl: ['', [Validators.required, Validators.maxLength(700)]],
    sortOrder: [0],
    active: [true],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listProductBlanks().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (blanks) => this.blanks.set(blanks),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể tải danh sách phôi.'),
    });
  }

  edit(blank: ProductBlank): void {
    this.editingId.set(blank.id);
    this.error.set(null); this.message.set(null);
    this.blankForm.setValue({ name: blank.name, size: blank.size, imageUrl: blank.imageUrl, sortOrder: blank.sortOrder, active: blank.active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reset(): void {
    this.editingId.set(null);
    this.blankForm.reset({ name: '', size: '', imageUrl: '', sortOrder: 0, active: true });
    this.error.set(null);
  }

  submit(): void {
    if (this.blankForm.invalid) {
      this.blankForm.markAllAsTouched();
      this.error.set('Vui lòng nhập đầy đủ tên, kích thước và ảnh phôi.');
      return;
    }
    const value = this.blankForm.getRawValue();
    const request: ProductBlankUpsertRequest = {
      ...value, name: value.name.trim(), size: value.size.trim(), imageUrl: value.imageUrl.trim(),
    };
    const id = this.editingId();
    this.saving.set(true); this.error.set(null); this.message.set(null);
    const operation = id === null ? this.api.createProductBlank(request) : this.api.updateProductBlank(id, request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.reset(); this.message.set(id === null ? 'Đã tạo phôi.' : 'Đã cập nhật phôi.'); this.load(); },
      error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu phôi.'),
    });
  }

  toggle(blank: ProductBlank): void {
    this.api.changeProductBlankStatus(blank.id, !blank.active).subscribe({
      next: (updated) => this.blanks.update((items) => items.map((item) => item.id === updated.id ? updated : item)),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể đổi trạng thái phôi.'),
    });
  }

  archive(blank: ProductBlank): void {
    if (!window.confirm(`Lưu trữ phôi “${blank.name}”? Phôi này sẽ không còn xuất hiện để khách lựa chọn.`)) return;
    this.api.archiveProductBlank(blank.id).subscribe({
      next: () => { if (this.editingId() === blank.id) this.reset(); this.load(); },
      error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu trữ phôi.'),
    });
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error.set('Chỉ có thể tải file hình ảnh.'); input.value = ''; return; }
    this.uploading.set(true);
    this.api.uploadImage(file).pipe(finalize(() => { this.uploading.set(false); input.value = ''; })).subscribe({
      next: (image) => this.blankForm.controls.imageUrl.setValue(image.imageUrl),
      error: () => this.error.set('Không thể tải ảnh phôi.'),
    });
  }
}

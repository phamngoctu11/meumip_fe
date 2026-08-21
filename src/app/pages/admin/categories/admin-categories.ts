import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { Category, CategoryUpsertRequest } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

@Component({ selector: 'app-admin-categories', imports: [ReactiveFormsModule, FeedbackBanner, ImageFallbackDirective], templateUrl: './admin-categories.html', styleUrl: './admin-categories.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AdminCategories implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);
  readonly categories = signal<Category[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly categoryForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    slug: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''], imageUrl: ['', Validators.maxLength(500)], sortOrder: [0], active: [true],
  });

  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.api.listCategories().pipe(finalize(() => this.loading.set(false))).subscribe({ next: (categories) => this.categories.set(categories), error: (error) => this.error.set(error.error?.message ?? 'Không thể tải danh mục.') }); }
  generateSlug(): void { const control = this.categoryForm.controls.slug; if (!control.dirty && !control.value) control.setValue(this.slugify(this.categoryForm.controls.name.value)); }
  edit(category: Category): void { this.editingId.set(category.id); this.error.set(null); this.message.set(null); this.categoryForm.setValue({ name: category.name, slug: category.slug, description: category.description ?? '', imageUrl: category.imageUrl ?? '', sortOrder: category.sortOrder, active: category.active }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  reset(): void { this.editingId.set(null); this.categoryForm.reset({ name: '', slug: '', description: '', imageUrl: '', sortOrder: 0, active: true }); this.error.set(null); }
  submit(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); this.error.set('Vui lòng nhập tên và slug danh mục.'); return; }
    const value = this.categoryForm.getRawValue(); const request: CategoryUpsertRequest = { ...value, name: value.name.trim(), slug: this.slugify(value.slug) };
    const id = this.editingId(); this.saving.set(true); this.error.set(null); this.message.set(null);
    const operation = id === null ? this.api.createCategory(request) : this.api.updateCategory(id, request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.message.set(id === null ? 'Đã tạo danh mục.' : 'Đã cập nhật danh mục.'); this.reset(); this.load(); }, error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu danh mục.') });
  }
  toggle(category: Category): void { const request: CategoryUpsertRequest = { slug: category.slug, name: category.name, description: category.description ?? '', imageUrl: category.imageUrl ?? '', sortOrder: category.sortOrder, active: !category.active }; this.api.updateCategory(category.id, request).subscribe({ next: (updated) => this.categories.update((items) => items.map((item) => item.id === updated.id ? updated : item)), error: (error) => this.error.set(error.error?.message ?? 'Không thể đổi trạng thái danh mục.') }); }
  archive(category: Category): void { if (!window.confirm(`Lưu trữ danh mục “${category.name}”?`)) return; this.api.archiveCategory(category.id).subscribe({ next: () => { if (this.editingId() === category.id) this.reset(); this.load(); }, error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu trữ danh mục.') }); }
  uploadImage(event: Event): void { const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { this.error.set('Chỉ có thể tải file hình ảnh.'); input.value = ''; return; } this.uploading.set(true); this.api.uploadImage(file).pipe(finalize(() => { this.uploading.set(false); input.value = ''; })).subscribe({ next: (image) => this.categoryForm.controls.imageUrl.setValue(image.imageUrl), error: () => this.error.set('Không thể tải ảnh danh mục.') }); }
  private slugify(value: string): string { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
}

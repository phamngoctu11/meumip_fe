import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { HomeSlide, HomeSlideUpsertRequest } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

@Component({ selector: 'app-admin-slides', imports: [ReactiveFormsModule, FeedbackBanner, ImageFallbackDirective], templateUrl: './admin-slides.html', styleUrl: './admin-slides.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AdminSlides implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);
  readonly slides = signal<HomeSlide[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly slideForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    eyebrow: ['', Validators.maxLength(120)],
    description: [''],
    imageUrl: ['', [Validators.required, Validators.maxLength(700)]],
    linkLabel: ['', Validators.maxLength(120)],
    linkUrl: ['', Validators.maxLength(500)],
    sortOrder: [0],
    active: [true],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.listSlides().pipe(finalize(() => this.loading.set(false))).subscribe({ next: (slides) => this.slides.set(slides), error: (error) => this.error.set(error.error?.message ?? 'Không thể tải danh sách slide.') });
  }

  edit(slide: HomeSlide): void {
    this.editingId.set(slide.id); this.message.set(null); this.error.set(null);
    this.slideForm.setValue({ title: slide.title, eyebrow: slide.eyebrow ?? '', description: slide.description ?? '', imageUrl: slide.imageUrl, linkLabel: slide.linkLabel ?? '', linkUrl: slide.linkUrl ?? '', sortOrder: slide.sortOrder, active: slide.active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reset(): void { this.editingId.set(null); this.slideForm.reset({ title: '', eyebrow: '', description: '', imageUrl: '', linkLabel: '', linkUrl: '', sortOrder: 0, active: true }); this.error.set(null); }

  submit(): void {
    if (this.slideForm.invalid) { this.slideForm.markAllAsTouched(); this.error.set('Vui lòng nhập tiêu đề và ảnh slide.'); return; }
    const request: HomeSlideUpsertRequest = this.slideForm.getRawValue();
    const id = this.editingId(); this.saving.set(true); this.error.set(null); this.message.set(null);
    const operation = id === null ? this.api.createSlide(request) : this.api.updateSlide(id, request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.message.set(id === null ? 'Đã tạo slide.' : 'Đã cập nhật slide.'); this.reset(); this.load(); }, error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu slide.') });
  }

  toggle(slide: HomeSlide): void { this.api.changeSlideStatus(slide.id, !slide.active).subscribe({ next: (updated) => this.slides.update((items) => items.map((item) => item.id === updated.id ? updated : item)), error: (error) => this.error.set(error.error?.message ?? 'Không thể đổi trạng thái slide.') }); }

  archive(slide: HomeSlide): void {
    if (!window.confirm(`Lưu trữ slide “${slide.title}”?`)) return;
    this.api.archiveSlide(slide.id).subscribe({ next: () => { if (this.editingId() === slide.id) this.reset(); this.load(); }, error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu trữ slide.') });
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error.set('Chỉ có thể tải lên file hình ảnh.'); input.value = ''; return; }
    this.uploading.set(true);
    this.api.uploadImage(file).pipe(finalize(() => { this.uploading.set(false); input.value = ''; })).subscribe({ next: (image) => this.slideForm.controls.imageUrl.setValue(image.imageUrl), error: () => this.error.set('Không thể tải ảnh slide.') });
  }
}

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { formatVnd, HomeCombo, HomeComboUpsertRequest, KitComponent, KitComponentRequest } from '../../../core/models';
import { FeedbackBanner } from '../../../shared/feedback-banner/feedback-banner';
import { ImageFallbackDirective } from '../../../shared/image-fallback.directive';

@Component({
  selector: 'app-admin-combos',
  imports: [ReactiveFormsModule, FeedbackBanner, ImageFallbackDirective],
  templateUrl: './admin-combos.html',
  styleUrl: './admin-combos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCombos implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly combos = signal<HomeCombo[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly formatVnd = formatVnd;

  readonly comboForm = this.formBuilder.nonNullable.group({
    code: ['', Validators.maxLength(40)],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: [''],
    imageUrl: ['', Validators.maxLength(700)],
    itemCount: [1, [Validators.required, Validators.min(1), Validators.max(3)]],
    priceVnd: [0, [Validators.required, Validators.min(1)]],
    priceNote: ['', Validators.maxLength(160)],
    tagsText: ['', Validators.maxLength(255)],
    componentsText: [''],
    sortOrder: [0],
    active: [true],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.listCombos().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (combos) => this.combos.set(combos),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể tải danh sách combo.'),
    });
  }

  edit(combo: HomeCombo): void {
    this.editingId.set(combo.id);
    this.error.set(null);
    this.message.set(null);
    this.comboForm.setValue({
      code: combo.code ?? '', title: combo.title, description: combo.description ?? '',
      imageUrl: combo.imageUrl ?? '', itemCount: combo.itemCount, priceVnd: combo.priceVnd, priceNote: combo.priceNote ?? '',
      tagsText: combo.tags.join(', '), componentsText: this.formatComponents(combo.components),
      sortOrder: combo.sortOrder, active: combo.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reset(): void {
    this.editingId.set(null);
    this.comboForm.reset({ code: '', title: '', description: '', imageUrl: '', itemCount: 1, priceVnd: 0, priceNote: '', tagsText: '', componentsText: '', sortOrder: 0, active: true });
    this.error.set(null);
  }

  submit(): void {
    if (this.comboForm.invalid) {
      this.comboForm.markAllAsTouched();
      this.error.set('Vui lòng nhập tiêu đề, giá và chọn số phôi từ 1 đến 3.');
      return;
    }
    const value = this.comboForm.getRawValue();
    const tags = this.parseTags(value.tagsText);
    const components = this.parseComponents(value.componentsText);
    const request: HomeComboUpsertRequest = {
      code: value.code.trim(),
      title: value.title.trim(),
      description: value.description.trim(),
      imageUrl: value.imageUrl.trim(),
      itemCount: value.itemCount,
      priceVnd: value.priceVnd,
      priceNote: value.priceNote.trim(),
      sortOrder: value.sortOrder,
      active: value.active,
    };
    if (tags.length) request.tags = tags;
    if (components.length) request.components = components;
    const id = this.editingId();
    this.saving.set(true); this.error.set(null); this.message.set(null);
    const operation = id === null ? this.api.createCombo(request) : this.api.updateCombo(id, request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.reset(); this.message.set(id === null ? 'Đã tạo combo.' : 'Đã cập nhật combo.'); this.load(); },
      error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu combo.'),
    });
  }

  toggle(combo: HomeCombo): void {
    this.api.changeComboStatus(combo.id, !combo.active).subscribe({
      next: (updated) => this.combos.update((items) => items.map((item) => item.id === updated.id ? updated : item)),
      error: (error) => this.error.set(error.error?.message ?? 'Không thể đổi trạng thái combo.'),
    });
  }

  archive(combo: HomeCombo): void {
    if (!window.confirm(`Lưu trữ combo “${combo.title}”?`)) return;
    this.api.archiveCombo(combo.id).subscribe({
      next: () => { if (this.editingId() === combo.id) this.reset(); this.load(); },
      error: (error) => this.error.set(error.error?.message ?? 'Không thể lưu trữ combo.'),
    });
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error.set('Chỉ có thể tải file hình ảnh.'); input.value = ''; return; }
    this.uploading.set(true);
    this.api.uploadImage(file).pipe(finalize(() => { this.uploading.set(false); input.value = ''; })).subscribe({
      next: (image) => this.comboForm.controls.imageUrl.setValue(image.imageUrl),
      error: () => this.error.set('Không thể tải ảnh combo.'),
    });
  }

  private parseTags(value: string): string[] {
    return value
      .split(/[,\s#]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  private parseComponents(value: string): KitComponentRequest[] {
    return value
      .split(/\r?\n/)
      .map((line, index) => {
        const [name = '', quantity = '1', unit = '', note = ''] = line.split('|').map((part) => part.trim());
        return {
          name,
          quantity: Number(quantity) || 1,
          unit,
          note,
          sortOrder: index,
        };
      })
      .filter((component) => component.name);
  }

  private formatComponents(components: KitComponent[]): string {
    return components
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((component) => [component.name, component.quantity || 1, component.unit ?? '', component.note ?? ''].join(' | '))
      .join('\n');
  }
}

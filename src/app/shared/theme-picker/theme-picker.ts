import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { AuthStore } from '../../core/auth.store';
import { ThemeId, ThemeStore } from '../../core/theme.store';

@Component({
  selector: 'app-theme-picker',
  templateUrl: './theme-picker.html',
  styleUrl: './theme-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemePicker {
  private readonly document = inject(DOCUMENT);
  readonly themeStore = inject(ThemeStore);
  readonly authStore = inject(AuthStore);
  readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private previousBodyOverflow = '';

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (this.themeStore.pickerOpen() && !element.open) {
        this.previousBodyOverflow = this.document.body.style.overflow;
        this.document.body.style.overflow = 'hidden';
        element.showModal();
      } else if (!this.themeStore.pickerOpen() && element.open) {
        element.close();
        this.restoreBodyOverflow();
      }
    });
  }

  preview(theme: ThemeId): void {
    this.themeStore.preview(theme);
  }

  select(theme: ThemeId): void {
    this.themeStore.select(theme);
  }

  cancel(event?: Event): void {
    event?.preventDefault();
    this.themeStore.cancel();
    this.restoreBodyOverflow();
  }

  confirm(): void {
    this.themeStore.confirm();
    this.restoreBodyOverflow();
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }

  onNativeClose(): void {
    if (this.themeStore.pickerOpen()) this.themeStore.cancel();
    this.restoreBodyOverflow();
  }

  private restoreBodyOverflow(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
  }
}

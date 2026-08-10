import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
})
export class ImageFallbackDirective {
  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly fallback = '/images/product-placeholder.svg';

  @HostListener('error')
  onImageError(): void {
    const image = this.element.nativeElement;
    if (!image.src.endsWith(this.fallback)) {
      image.src = this.fallback;
    }
  }
}

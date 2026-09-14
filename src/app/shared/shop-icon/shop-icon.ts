import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const PATHS = {
  menu: 'M4 6.5 20 6M4 12h15M4 18l16-.5',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  gift: 'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9C5 9 4 6 6 4c3-2 6 5 6 5Zm0 0s3-7 6-5c3 2 0 5-6 5Z',
  cart: 'M2 3h3l2 13h12l2-10H6M9 21h.01M18 21h.01',
  orders: 'M6 3h12l2 2v16H4V3h2M8 8h.01M12 8h5M8 12h.01M12 12h5M8 16h.01M12 16h5',
  close: 'm6 6 12 12M18 6 6 18',
  up: 'm6 15 6-7 6 7',
  down: 'm6 9 6 7 6-7',
  left: 'm15 5-7 7 7 7',
  right: 'm9 5 7 7-7 7',
  grid2: 'M3 4h7v16H3zM14 4h7v16h-7z',
  grid3: 'M3 4h4v6H3zM10 4h4v6h-4zM17 4h4v6h-4zM3 14h4v6H3zM10 14h4v6h-4zM17 14h4v6h-4z',
  note: 'M10 17V4l9 3v5M10 17c0 5-7 5-7 1s7-5 7-1M10 6l9 3',
  star: 'm12 2 3 6 7 2-5 5 1 7-6-3-6 3 1-7-5-5 7-2Z',
  heart: 'M12 21S1 14 3 7c2-5 7-4 9 0 2-4 7-5 9 0 2 7-9 14-9 14Z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 7h.01',
  facebook: 'M15 22V13h3l1-4h-4V6c0-2 2-2 4-2V1h-4c-3 0-5 2-5 5v3H7v4h3v9',
  youtube: 'M21 7c-1-3-17-3-18 0-1 3-1 7 0 10 1 3 17 3 18 0 1-3 1-7 0-10ZM10 8l6 4-6 4Z',
  tiktok: 'M14 3v12a5 5 0 1 1-5-5M14 3c1 4 3 6 7 6M17 3v12a8 8 0 1 1-8-8',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
} as const;

@Component({
  selector: 'app-shop-icon',
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="paths[name()]" /></svg>',
  styles: ':host { display: inline-flex; width: 1.5rem; height: 1.5rem; flex: 0 0 auto; } svg { width: 100%; height: 100%; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopIcon {
  readonly name = input.required<keyof typeof PATHS>();
  readonly paths = PATHS;
}

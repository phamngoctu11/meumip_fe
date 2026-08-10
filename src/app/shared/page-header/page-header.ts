import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly eyebrow = input<string | null>(null);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly align = input<'left' | 'center'>('center');
}

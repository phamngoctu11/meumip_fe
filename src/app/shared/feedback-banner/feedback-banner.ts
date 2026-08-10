import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type FeedbackTone = 'info' | 'success' | 'error';

@Component({
  selector: 'app-feedback-banner',
  templateUrl: './feedback-banner.html',
  styleUrl: './feedback-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackBanner {
  readonly message = input.required<string>();
  readonly tone = input<FeedbackTone>('info');
  readonly icon = computed(() => ({ info: '✦', success: '♡', error: '!' })[this.tone()]);
  readonly role = computed(() => (this.tone() === 'error' ? 'alert' : 'status'));
}

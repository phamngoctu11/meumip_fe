import { ChangeDetectionStrategy, Component } from '@angular/core';

export const APP_BACKGROUND_IMAGE_URL =
  'https://res.cloudinary.com/dgoolohc8/image/upload/v1787302994/meumip/products/site-background-download-5.jpg';

@Component({
  selector: 'app-background',
  templateUrl: './app-background.html',
  styleUrl: './app-background.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBackground {
  readonly backgroundImage = `url("${APP_BACKGROUND_IMAGE_URL}")`;
}
